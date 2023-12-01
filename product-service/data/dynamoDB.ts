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

const products: Product[] = [
  {
    title: "ProductOneDynamoDB",
    price: 24,
    description: "Short Product Description1",
  },
  {
    title: "ProductTwoDynamoDB",
    price: 12,
    description: "Short Product Description2",
  },
  {
    title: "ProductThreeDynamoDB",
    price: 36,
    description: "Short Product Description3",
  },
];

export const main = async () => {
  for (const product of products) {
    const id = uuidv4();
    const command = new PutCommand({
      TableName: "products",
      Item: {
        ...product,
        id: id,
      },
    });

    await docClient.send(command);
    console.log("product added: ", product);
  }
};

main();
