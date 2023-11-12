import { mockedProducts } from "../data/products";

export async function handler(event: any, products = mockedProducts) {
  try {
    if (products.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Products not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Acces-Control-Allow-Credentials": true,
        "Acces-Control-Allow-Origin": true,
        "Acces-Control-Allow-Headers": true,
      },
      body: JSON.stringify(products),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message,
      }),
    };
  }
}
