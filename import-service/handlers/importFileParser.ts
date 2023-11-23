import { S3Event } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as csvFile from "csv-parser";
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

    console.log(`bucket name: ${bucket}, key event: ${key}`);

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
