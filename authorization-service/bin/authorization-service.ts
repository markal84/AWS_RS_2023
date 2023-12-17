#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { config } from "dotenv";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";

config();

const { AWS_REGION } = process.env;

const app = new cdk.App();

const stack = new cdk.Stack(app, "AuthorizationServiceStack", {
  env: { region: AWS_REGION! },
});

const lambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: AWS_REGION!,
  },
};

const basicAuthorizer = new NodejsFunction(stack, "basicAuthorizerLambda", {
  ...lambdaProps,
  functionName: "basicAuthorizer",
  entry: "handlers/basicAuthorizer.ts",
});

new cdk.CfnOutput(stack, "BasicAuthorizerLambdaArn", {
  value: basicAuthorizer.functionArn,
});
