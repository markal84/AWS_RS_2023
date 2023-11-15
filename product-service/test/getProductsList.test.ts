import { handler } from "../handlers/getProductsList";

describe("Lambda Function Tests - Get Product List", () => {
  it("should return products if they exist", async () => {
    const event = {};

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("Short Product Description1");
  });

  it("should return 3 products", async () => {
    const event = {};

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).length).toBe(3);
  });
});
