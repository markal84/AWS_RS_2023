import { handler } from "../handlers/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

jest.mock("../lib/utils", () => ({
  buildResponse: jest.fn((status: number, data: any) => ({
    statusCode: status,
    body: JSON.stringify(data),
  })),
}));

describe("import products file lambda", () => {
  afterEach(() => {
    mockClient(S3Client).reset();
  });

  it("should return status 400 if file name is missing", async () => {
    const s3Mock = mockClient(S3Client);

    const event: any = {};

    s3Mock.on(PutObjectCommand).rejects(new Error("File name is missing"));

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBeDefined();
    expect(response.body).toContain("Missing requested paramater - file name");
  });

  it("should return status 200 and create signed url for csv file if successfull", async () => {
    const s3Mock = mockClient(S3Client);

    s3Mock.on(PutObjectCommand).resolves({});

    const event: any = {
      queryStringParameters: {
        name: "default.csv",
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body).toContain("/uploaded/default.csv");
  });

  it("should return status 500 if there is an error uploading the file", async () => {
    const s3Mock = mockClient(S3Client);

    s3Mock.on(PutObjectCommand).rejects(new Error("Failed to upload"));

    const event: any = {
      queryStringParameters: {
        name: "default.csv",
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeDefined();
  });
});
