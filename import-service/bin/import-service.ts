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
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

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
