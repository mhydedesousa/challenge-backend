import request from "supertest";
import { app, server } from "../src/index";

import { data } from "../src/sample-data";

beforeAll((done) => {
  done();
});

afterAll((done) => {
  server.close();
  done();
});

describe("GET /styles", () => {
  it("should return data", async () => {
    const response = await request(app).get("/styles");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(data);
  });
});
