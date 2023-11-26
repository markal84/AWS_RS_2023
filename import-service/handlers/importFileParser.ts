import { S3Event } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csv from "csv-parser";
import { buildResponse } from "../lib/utils";

export async function handler(event: S3Event) {
  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    console.log("importFileParserLog: ", event);

    if (!key.startsWith("uploaded/")) {
      console.log("Even must by starting in upload folder. Skipping");
      return;
    }

    const params = {
      Bucket: bucket,
      Key: key,
    };

    const copyParams = {
      ...params,
      Key: `parsed/${key}`,
      CopySource: `${bucket}/${key}`,
    };

    const client = new S3Client({ region: "eu-north-1" });

    const getObjectCommand = new GetObjectCommand(params);

    const copyObjectCommand = new CopyObjectCommand(copyParams);
    //const copyFile = await client.send(copyObjectCommand);

    const deleteObjectCommand = new DeleteObjectCommand(params);
    //const deleteFile = await client.send(deleteObjectCommand);

    const { Body } = await client.send(getObjectCommand);

    if (!Body) {
      throw new Error("No object data found");
    }

    const stream = Body as Readable;

    stream
      .pipe(csv())
      .on("data", (row) => {
        console.log("CSV file Row:", row);
      })
      .on("end", () => {
        console.log("CSV file parsing finished");
      })
      .on("error", (error) => {
        console.error("CSV file Parsing Error:", error);
        throw new Error("CSV Parsing Error");
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
