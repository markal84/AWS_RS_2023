import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

type Product = {
  title: string;
  description: string;
  price: number;
  count: number;
};

const client = new DynamoDBClient({});

export async function handler(event: any) {
  try {
    const requestBody = JSON.parse(event.body || "{}") as Product;

    console.log(
      "Create product handler: \n",
      event,
      "\n Parameters (product): \n",
      requestBody
    );

    const count = requestBody.count;

    if (!requestBody.title || !count) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required parameters: title and count",
        }),
      };
    }

    const id = uuidv4();
    const price = requestBody.price || 1;

    const transactionItems = [
      {
        Put: {
          TableName: "products",
          Item: {
            ...requestBody,
            price,
            id,
          },
        },
      },
      {
        Put: {
          TableName: "stocks",
          Item: {
            product_id: id,
            count,
          },
        },
      },
    ];

    const transactionCommand = new TransactWriteCommand({
      TransactItems: transactionItems,
    });
    await client.send(transactionCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Product created successfully`,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating product",
        error: error.message,
      }),
    };
  }
}
