import request from "supertest";
import axios from "axios";
import { app, server } from "../src/index";
import {
  noDefinitionOrExampleResponse,
  nonVerbDictionaryResponse,
  verbDictionaryResponse,
} from "./constants";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll((done) => {
  done();
});

afterAll((done) => {
  server.close();
  done();
});

describe("GET /get-word/:word", () => {
  it("should return an example usage when a valid word that can be used as a verb is provided", async () => {
    const mockWordInfoResponse = {
      data: verbDictionaryResponse,
    };
    mockedAxios.get.mockResolvedValue(mockWordInfoResponse);

    const response = await request(app).get("/get-word/test");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      example: "Climbing the mountain tested our stamina.",
    });
  });

  it("should return a definition when a valid word that CANNOT be used as a verb is provided", async () => {
    const mockWordInfoResponse = {
      data: nonVerbDictionaryResponse,
    };
    mockedAxios.get.mockResolvedValue(mockWordInfoResponse);

    const response = await request(app).get("/get-word/hello");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      definition: '"Hello!" or an equivalent greeting.',
    });
  });

  it("should return an example usage when a valid word that can be used as a verb is provided but with spaces", async () => {
    const mockWordInfoResponse = {
      data: verbDictionaryResponse,
    };
    mockedAxios.get.mockResolvedValue(mockWordInfoResponse);

    const response = await request(app).get("/get-word/  test");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      example: "Climbing the mountain tested our stamina.",
    });
  });

  it("should return a definition when a valid word that CANNOT be used as a verb is provided but with spaces", async () => {
    const mockWordInfoResponse = {
      data: nonVerbDictionaryResponse,
    };
    mockedAxios.get.mockResolvedValue(mockWordInfoResponse);

    const response = await request(app).get("/get-word/  hello");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      definition: '"Hello!" or an equivalent greeting.',
    });
  });

  it("should return a nice error when the word is found but no definition or example is found", async () => {
    const mockWordInfoResponse = {
      data: noDefinitionOrExampleResponse,
    };
    mockedAxios.get.mockResolvedValue(mockWordInfoResponse);

    const response = await request(app).get("/get-word/invalid");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Word found but example or definition not found for this word",
    });
  });

  it("should handle a case where the word is not found in the dictionary (response is undefined)", async () => {
    mockedAxios.get.mockResolvedValue({});

    const response = await request(app).get("/get-word/aaaaaaa");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Word not found in dictionary" });
  });

  it("should handle a case where the word is not found in the dictionary due to an axios error", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          title: "No Definitions Found",
          message:
            "Sorry pal, we couldn't find definitions for the word you were looking for.",
          resolution:
            "You can try the search again at later time or head to the web instead.",
        },
      },
    });

    const response = await request(app).get("/get-word/bbbbbbbb");
    console.log(response.status);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message:
        "Sorry pal, we couldn't find definitions for the word you were looking for.",
    });
  });

  it("should handle a case where the word is not found in the dictionary due to an axios error. Should throw a nice error even if the error format is wrong", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        invalid: 404,
        invalidData: {
          title: "No Definitions Found",
          message:
            "Sorry pal, we couldn't find definitions for the word you were looking for.",
          resolution:
            "You can try the search again at later time or head to the web instead.",
        },
      },
    });

    const response = await request(app).get("/get-word/bbb");
    console.log(response);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Dictionary Service may be down",
    });
  });

  it("should handle a case where no word is provided but empty space is.", async () => {
    const response = await request(app).get("/get-word/%20%20");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Please provide a word" });
  });

  it("should handle a case where no word is provided. endpoint is not found", async () => {
    const response = await request(app).get("/get-word/");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Endpoint not found" });
  });
});

describe("POST /number-to-word", () => {
  it("should return the word representation for a valid single-digit number", async () => {
    const response = await request(app)
      .post("/number-to-word")
      .send({ num: 3 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual("three");
  });

  it("should handle a case where the input is not a single-digit number", async () => {
    const response = await request(app)
      .post("/number-to-word")
      .send({ num: 12 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message:
        'Please enter a digit between 0 and 9 inclusive. Sample input: { "num": 7 }',
    });
  });

  it("should handle a case where the input has a decimal", async () => {
    const response = await request(app)
      .post("/number-to-word")
      .send({ num: 0.1 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message:
        'Please enter a digit between 0 and 9 inclusive. Sample input: { "num": 7 }',
    });
  });

  it("should handle a case where the input is not a number", async () => {
    const response = await request(app)
      .post("/number-to-word")
      .send({ num: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message:
        'Please enter a digit between 0 and 9 inclusive. Sample input: { "num": 7 }',
    });
  });

  it("should handle a case where the input is invalid (no num provided)", async () => {
    const response = await request(app)
      .post("/number-to-word")
      .send({ invalid: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message:
        'Please enter a digit between 0 and 9 inclusive. Sample input: { "num": 7 }',
    });
  });
});

describe("GET /who-made-me", () => {
  it("should return the creator and a fun fact about them", async () => {
    const response = await request(app).get("/who-made-me");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      creator: "Michael Hyde-de Sousa",
      funFact: "I have seen 1030 movies.",
    });
  });
});
