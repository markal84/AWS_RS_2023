import { handler } from "../handlers/getProductById";

describe("Lambda Function Tests - Get Product By ID", () => {
  it("should return status code 404 for product not found", async () => {
    const event = {
      pathParameters: {
        productId: "8987",
      },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(result.body).toContain("Product not found");
  });

  it("should return product and status code 200 for product found", async () => {
    const event = {
      pathParameters: {
        productId: "2",
      },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("Short Product Description7");
  });
});
