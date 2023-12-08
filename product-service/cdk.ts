import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Queue, QueueProps } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

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

const productsTable = dynamodb.Table.fromTableName(
  stack,
  "ProductsTable",
  "products"
);
const stocksTable = dynamodb.Table.fromTableName(
  stack,
  "StocksTable",
  "stocks"
);

const importProductTopic = new sns.Topic(stack, "ImortProductTopic", {
  topicName: "import-products-topic",
});

new sns.Subscription(stack, "BigStockSubcription", {
  endpoint: "kalet1984@gmail.com",
  protocol: sns.SubscriptionProtocol.EMAIL,
  topic: importProductTopic,
});

const queueProps: QueueProps = {
  queueName: "import-file-batch-queue",
};

const catalogItemsQueue = new Queue(stack, "catalogItemsQueue", queueProps);

const catalogBatchProcess = new NodejsFunction(
  stack,
  "CatalogBatchProcessLambda",
  {
    ...lambdaProps,
    functionName: "catalogBatchProcess",
    entry: "handlers/catalogBatchProcess.ts",
    environment: {
      SNS_ARN: importProductTopic.topicArn,
      TABLE_PRODUCTS: productsTable.tableName,
      TABLE_STOCKS: stocksTable.tableName,
    },
  }
);

catalogBatchProcess.addEventSource(
  new SqsEventSource(catalogItemsQueue, {
    batchSize: 5,
  })
);

productsTable.grantWriteData(catalogBatchProcess);
stocksTable.grantWriteData(catalogBatchProcess);

importProductTopic.grantPublish(catalogBatchProcess);

const getProductList = new NodejsFunction(stack, "GetProductListLambda", {
  ...lambdaProps,
  functionName: "getProductsList",
  entry: "handlers/getProductsList.ts",
});

const getProductById = new NodejsFunction(stack, "GetProductByIdLambda", {
  ...lambdaProps,
  functionName: "getProductById",
  entry: "handlers/getProductById.ts",
});

const createProduct = new NodejsFunction(stack, "CreateProductLambda", {
  ...lambdaProps,
  functionName: "createProduct",
  entry: "handlers/createProduct.ts",
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

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "GetProductsListIntergation",
    getProductById
  ),
  path: "/products/{productId}",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "CreateProductIntegration",
    createProduct
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.POST],
});
