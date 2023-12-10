import { SQSEvent, APIGatewayProxyResult } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { buildResponse } from "../data/libs/utils";
import { get } from "lodash";
import { handler as createProduct } from "./createProduct";
import { v4 as uuidv4 } from "uuid";

export async function handler(event: SQSEvent): Promise<APIGatewayProxyResult> {
  try {
    console.log("sqs event: ", event);
    const records = get(event, "Records", []);

    const snsClient = new SNSClient({
      region: "eu-north-1",
    });

    const processedTitles: Set<string> = new Set();

    for (const record of records) {
      console.log("record: ", record);
      const { description, title, price, count } = JSON.parse(record.body);

      if (processedTitles.has(title)) {
        console.log(`Skipping duplicate product title: ${title}`);
        continue;
      }

      const id = uuidv4();
      const product = { id, description, title, price: Number(price) };
      const stock = { product_id: id, count: Number(count) };
      const newProduct = { ...product, ...stock };
      console.log({ newProduct });

      const result = await createProduct(record);

      await snsClient.send(
        new PublishCommand({
          Subject: "New Products Added to Catalog",
          TopicArn: "arn:aws:sns:eu-north-1:298531520651:import-products-topic",
          Message: JSON.stringify({
            result,
          }),
        })
      );
    }

    return buildResponse(200, records);
  } catch (err) {
    console.log(err);
    return buildResponse(500, err);
  }
}
