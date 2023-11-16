import { v4 as uuidv4 } from "uuid";
import * as AWS from "aws-sdk";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
};

const id = uuidv4();

const docClient = new AWS.DynamoDB.DocumentClient();

const products: Product[] = [
  {
    id: id,
    title: "ProductOneDynamoDB",
    price: 24,
    description: "Short Product Description1",
  },
  {
    id: id,
    title: "ProductTwoDynamoDB",
    price: 12,
    description: "Short Product Description2",
  },
  {
    id: id,
    title: "ProductThreeDynamoDB",
    price: 36,
    description: "Short Product Description3",
  },
];

// Funkcja do dodawania produktów
async function addProductsToDynamoDB() {
  try {
    for (const product of products) {
      const params = {
        TableName: "products",
        Item: product,
      };
      await docClient.put(params).promise();
      console.log(`Dodano produkt o ID: ${product.id}`);
    }
  } catch (err) {
    console.error("Błąd podczas dodawania produktów do DynamoDB:", err);
  }
}

// Wywołanie funkcji
addProductsToDynamoDB();
