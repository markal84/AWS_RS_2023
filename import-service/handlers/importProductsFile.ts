import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildResponse } from "../lib/utils";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("ImportService log: ", event);

  const fileName = event.queryStringParameters?.name;
  console.log("file name parameter: ", fileName);

  const bucket = "uploadproducts";

  if (!fileName) {
    return buildResponse(400, {
      message: "Missing requested paramater - file name",
    });
  }

  const client = new S3Client({ region: "eu-north-1" });
  const filePatch = `uploaded/${fileName}`;

  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: filePatch,
    ContentType: "text/csv",
  });

  try {
    await client.send(putCommand);
    const signedUrl = await getSignedUrl(client, putCommand, { expiresIn: 60 });
    console.log(signedUrl);
    return buildResponse(200, signedUrl);
  } catch (error: any) {
    return buildResponse(500, {
      message: error.message,
    });
  }
};
