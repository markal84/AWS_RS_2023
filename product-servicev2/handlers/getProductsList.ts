//import { mockProducts } from "src/helpers/products";

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
      body: JSON.stringify({
        products: [
          {
            id: 1,
            productName:
              "first raw body data, later json.stringifaly product from file",
            price: 32,
          },
        ],
      }),
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

/*
    "@aws-cdk/aws-apigatewayv2-alpha": "^2.105.0-alpha.0",
    "@aws-cdk/aws-apigatewayv2-integrations-alpha": "^2.105.0-alpha.0",
*/
