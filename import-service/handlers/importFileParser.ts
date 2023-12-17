import { S3Event } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Readable, PassThrough } from "stream";
import csv from "csv-parser";
import { buildResponse } from "../lib/utils";

export async function handler(event: S3Event) {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const splitKey = key.split("/");
  const fileName = splitKey[splitKey.length - 1];

  console.log("bucket: ", bucket, "filePatch: ", key, "file name: ", fileName);

  if (!key.startsWith("uploaded/")) {
    console.log("Even must by starting in upload folder. Skipping");
    return;
  }

  const client = new S3Client({ region: "eu-north-1" });
  const sqsClient = new SQSClient({ region: "eu-north-1" });

  try {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    const copyParams = {
      ...params,
      Key: `parsed/${fileName}`,
      CopySource: `${bucket}/${key}`,
    };

    const getObjectCommand = new GetObjectCommand(params);

    const copyObjectCommand = new CopyObjectCommand(copyParams);

    const deleteObjectCommand = new DeleteObjectCommand(params);

    const file = await client.send(getObjectCommand);
    console.log({ file });
    const readStream = file.Body;

    if (!(readStream instanceof Readable)) {
      throw new Error("Failed to read file");
    }

    await new Promise((resolve, reject) => {
      const stream = readStream.pipe(new PassThrough());
      stream
        .pipe(csv())
        .on("data", async (data) => {
          stream.pause();
          try {
            console.log("Send message to SQS", data);

            await sqsClient.send(
              new SendMessageCommand({
                QueueUrl:
                  "https://sqs.eu-north-1.amazonaws.com/298531520651/import-file-batch-queue",
                MessageBody: JSON.stringify(data),
              })
            );
          } catch (err) {
            console.log("can't send sqs messages->", data);
            reject(err);
          }

          stream.resume();
        })
        .on("error", reject)
        .on("end", async () => {
          console.log("CSV file parsing finished");
          try {
            await client.send(copyObjectCommand);
            console.log("Moving parsed file to parsed folder");
            await client.send(deleteObjectCommand);
            console.log("Deleting file from uploaded folder");
            resolve(null);
          } catch (err) {
            reject(err);
          }
        })
        .on("error", (error) => {
          console.error("CSV file Parsing Error:", error);
          reject(error);
        });
    });

    return buildResponse(200, {
      message: "Parsed successful",
    });
  } catch (error: any) {
    console.error(error);
    return buildResponse(500, {
      message: error.message,
    });
  }
}
