import { mockedProducts } from "../data/products";

export async function handler(event: any) {
  try {
    console.log(`working getProduct`, event);

    return {
      statusCode: 200,
      headers: {
        "Acces-Control-Allow-Credentials": true,
        "Acces-Control-Allow-Origin": true,
        "Acces-Control-Allow-Headers": true,
      },
      body: JSON.stringify(mockedProducts),
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
