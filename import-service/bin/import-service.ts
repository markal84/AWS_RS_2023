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
import { TokenAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { PolicyDocument, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { aws_iam } from "aws-cdk-lib";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
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

const authLambda = lambda.Function.fromFunctionArn(
  stack,
  "BasicAuthorizerLambda",
  AUTH_LAMBDA_ARN!
);

const authRole = new Role(stack, "authorizerRole", {
  roleName: "authorizer-role",
  assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
  inlinePolicies: {
    allowLambdaInvocation: PolicyDocument.fromJson({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["lambda:InvokeFunction", "lambda:InvokeAsync"],
          Resource: AUTH_LAMBDA_ARN!,
        },
      ],
    }),
  },
});

const authorizer = new TokenAuthorizer(stack, "basicAuthorizer", {
  handler: authLambda,
  authorizerName: "ImportAuthorizer",
  resultsCacheTtl: cdk.Duration.seconds(0),
  assumeRole: authRole,
});

authLambda.addPermission("apigateway", {
  principal: new aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
  sourceArn: authorizer.authorizerArn,
});

const lambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: "eu-north-1",
    BUCKET_NAME: "uploadproducts",
    SQS_URL: queue.queueUrl,
  },
};

const api = new apiGateway.HttpApi(stack, "ImportApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
  },
});

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

uploadBucket.grantReadWrite(importFileParser);
uploadBucket.grantDelete(importFileParser);
queue.grantSendMessages(importFileParser);

uploadBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParser),
  { prefix: "uploaded/" }
);

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "ImportProductFileIntegration",
    importProductsFile
  ),
  path: "/import",
  methods: [apiGateway.HttpMethod.GET],
});

new cdk.CfnOutput(stack, "Import service Url", {
  value: `${api.url}import`,
  description: `Import service API URL`,
});
