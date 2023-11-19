import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { buildResponse } from "../data/libs/utils";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler(event: any) {
  try {
    const productId: string = event.pathParameters.productId;
    console.log("Product ID:", productId);

    const getProductParams = {
      TableName: "products",
      Key: {
        id: productId,
      },
    };

    console.log("getProductParams: ", getProductParams);

    const getProductCommand = new GetCommand(getProductParams);
    const productData = await docClient.send(getProductCommand);

    if (!productData.Item) {
      return buildResponse(404, { message: "Product not found" });
    }

    const product = productData.Item;
    console.log("product from db: ", product);

    const getStockParams = {
      TableName: "stocks",
      Key: {
        product_id: productId,
      },
    };

    console.log("getStockParams:", getStockParams);

    const getStockCommand = new GetCommand(getStockParams);
    const stockData = await docClient.send(getStockCommand);

    const stock = stockData.Item;
    console.log("stock from db: ", stock);

    const productWithStock = {
      ...product,
      count: stock?.count,
    };

    console.log("final product merged: ", productWithStock);

    return buildResponse(200, productWithStock);
  } catch (err: any) {
    console.error("Error:", err);
    return buildResponse(500, { message: err.message });
  }
}
