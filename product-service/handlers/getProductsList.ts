import { mockedProducts } from "../data/products";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { buildResponse } from "../data/libs/utils";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler(event: any) {
  try {
    console.log("getProductsList event log: ", event);

    const productsDb = new ScanCommand({
      TableName: "products",
    });

    const stocksDb = new ScanCommand({
      TableName: "stocks",
    });

    const products = await docClient.send(productsDb);

    if (!products) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Products not found" }),
      };
    }

    const stocks = await docClient.send(stocksDb);

    const stocksMap = stocks.Items?.reduce(
      (acc, cur) => ({
        ...acc,
        [cur.product_id]: cur.count,
      }),
      {}
    );

    const productsForFe = products.Items?.map((product) => ({
      ...product,
      count: stocksMap![product.id] || 0,
    }));

    return buildResponse(200, productsForFe || []);
  } catch (err: any) {
    return buildResponse(500, {
      message: err.message,
    });
  }
}
