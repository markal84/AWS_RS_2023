import { handler } from "../handlers/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";
import AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";

jest.mock("../lib/utils", () => ({
  buildResponse: jest.fn((status: number, data: any) => ({
    statusCode: status,
    body: JSON.stringify(data),
  })),
}));

describe("Import Products File Lambda", () => {
  it("should handle import products file", async () => {
    const mockS3Send = jest.fn();
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock("S3", "putObject", (params: any, callback: Function) => {
      mockS3Send(params, callback);
    });

    const event: any = {
      queryStringParameters: {
        name: "example.csv",
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(event.queryStringParameters?.name).toBe("example.csv");

    AWSMock.restore("S3");
  });
});
