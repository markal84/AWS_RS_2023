import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

type Product = {
  title: string;
  description: string;
  price: number;
};

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler(event: any) {
  try {
    console.log("Create product handler: ", event);

    const requestBody = JSON.parse(event.body || "{}") as Product;
    const id = uuidv4();
    const price = requestBody.price || 1;

    const command = new PutCommand({
      TableName: "products",
      Item: {
        ...requestBody,
        price,
        id: id,
      },
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Product created successfully: ${requestBody}`,
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
