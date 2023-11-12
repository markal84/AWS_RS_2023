import { handler } from "../handlers/getProductsList";
import { mockedProducts } from "../data/products";

describe("Lambda Function Tests - Get Product List", () => {
  it("should return products if they exist", async () => {
    const event = {};

    const result = await handler(event, mockedProducts);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("Short Product Description1");
  });

  it("should return 3 products", async () => {
    const event = {};

    const result = await handler(event, mockedProducts);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).length).toBe(3);
  });

  it("should return 404 if no products are found", async () => {
    const event = {};
    const emptyProducts: [] = [];

    const result = await handler(event, emptyProducts);

    expect(result.statusCode).toBe(404);
    expect(result.body).toContain("Products not found");
  });
});
