import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";

const app = new cdk.App();

const stack = new cdk.Stack(app, "ProductServicesStack", {
  env: { region: "eu-north-1" },
});

const lambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: "eu-north-1",
  },
};

const getProductList = new NodejsFunction(stack, "GetProductListLambda", {
  ...lambdaProps,
  functionName: "getProductsList",
  entry: "handlers/getProductsList.ts",
});

const api = new apiGateway.HttpApi(stack, "ProductApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
  },
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "GetProductsListIntergation",
    getProductList
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.GET],
});
