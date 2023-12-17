#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apiGatewayv2 from "aws-cdk-lib/aws-apigateway";
import { config } from "dotenv";

config();

const { AUTH_LAMBDA_ARN } = process.env;

const app = new cdk.App();

const stack = new cdk.Stack(app, "ImportServicesStack", {
  env: { region: "eu-north-1" },
});

const uploadBucket = s3.Bucket.fromBucketName(
  stack,
  "ImportBucket",
  "uploadproducts"
);

const queue = sqs.Queue.fromQueueArn(
  stack,
  "importFileQueue",
  "arn:aws:sqs:eu-north-1:298531520651:import-file-batch-queue"
);

const lambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: "eu-north-1",
    BUCKET_NAME: "uploadproducts",
    SQS_URL: queue.queueUrl,
  },
};

const importProductsFile = new NodejsFunction(
  stack,
  "ImportProductsFileLambda",
  {
    ...lambdaProps,
    functionName: "importProductsFile",
    entry: "./handlers/importProductsFile.ts",
  }
);

uploadBucket.grantReadWrite(importProductsFile);

const importFileParser = new NodejsFunction(stack, "ImportFileParserLambda", {
  ...lambdaProps,
  functionName: "importFileParser",
  entry: "./handlers/importFileParser.ts",
});

const basicAuthorizer = lambda.Function.fromFunctionArn(
  stack,
  "basicAuthorizer",
  AUTH_LAMBDA_ARN!
);

const authorizer = new apiGatewayv2.TokenAuthorizer(
  stack,
  "ImportServiceAuthorizer",
  {
    handler: basicAuthorizer,
  }
);

new lambda.CfnPermission(stack, "BasicAuthorizerInvoke Permissions", {
  action: "lambda:InvokeFunction",
  functionName: basicAuthorizer.functionName,
  principal: "apigateway.amazonaws.com",
  sourceArn: authorizer.authorizerArn,
});

uploadBucket.grantReadWrite(importFileParser);
uploadBucket.grantDelete(importFileParser);
queue.grantSendMessages(importFileParser);

uploadBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParser),
  { prefix: "uploaded/" }
);

const api = new apiGatewayv2.RestApi(stack, "ImportApi", {
  defaultCorsPreflightOptions: {
    allowHeaders: ["*"],
    allowOrigins: apiGatewayv2.Cors.ALL_ORIGINS,
    allowMethods: apiGatewayv2.Cors.ALL_METHODS,
  },
});

api.root
  .addResource("ImportProductFileIntegration")
  .addMethod("GET", new apiGatewayv2.LambdaIntegration(importProductsFile), {
    requestParameters: { "method.request.querystring.name": true },
    authorizer,
  });

api.addGatewayResponse("GatewayResponseUnauthorized", {
  type: apiGatewayv2.ResponseType.UNAUTHORIZED,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'*'",
    "Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE'",
    "Access-Control-Allow-Credentials": "'true'",
  },
});

new cdk.CfnOutput(stack, "Import service Url", {
  value: `${api.url}import`,
  description: `Import service API URL`,
});

new cdk.CfnOutput(stack, "AuthorizerArn", {
  value: authorizer.authorizerArn,
});
