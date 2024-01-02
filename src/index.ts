import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { HttpError } from "http-errors";
import { BadRequest, NotFound } from "http-errors";
import axios from "axios";
import config from "../config";
import { DictionaryEntry, NumberToWordDTO } from "./interfaces";

dotenv.config({ path: ".env" });

const app: Express = express();
const port = config.PORT || 8000;

// request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.info(`${req.method} request to "${req.url}" by ${req.hostname}`);
  next();
});

// if application.x-www-form-urlencoded data will be used
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// will be using JSON payloads
app.use(express.json());

// start the listener
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// PART 1: get-word - Receives a url parameter of a word, uses https://dictionaryapi.dev/ to check if the word can be used as a verb.
// If it can, return an example usage, if not, return the dictionary definition. This is a GET
// should rename this to not have word "get" in the endpoint. Could be something like /words/:word
app.get(
  "/get-word/:word",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const word = req.params.word as string;
      if (!word || word.replace(/\s/g, "").length === 0) {
        throw new BadRequest("Please provide a word");
      }

      let wordInfoResponse = null;
      try {
        wordInfoResponse = await axios.get(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
        );
      } catch (error: any) {
        // handle axios errors
        const status = error.response?.status || 500;
        const errorMessage: any =
          error.response?.data?.message || "Dictionary Service may be down";
        const newError: any = new Error(errorMessage);
        newError.status = status;
        throw newError;
      }

      if (!wordInfoResponse?.data) {
        throw new NotFound("Word not found in dictionary");
      }

      const dictionaryEntry = wordInfoResponse.data as DictionaryEntry;

      let finalResVerbExample: object | undefined = undefined;
      let finalResDefinition: object | undefined = undefined;
      outerLoop: for (const wInfo of dictionaryEntry) {
        if (wInfo.meanings) {
          for (const m of wInfo.meanings) {
            if (m.definitions) {
              // set up first definition if in case no verb ends up being found
              // make sure to only do it if it hasn't been set yet
              if (!finalResDefinition) {
                const foundEntryWithDefinition = m.definitions.find(
                  (d: any) => d.definition
                );
                if (foundEntryWithDefinition) {
                  finalResDefinition = {
                    definition: foundEntryWithDefinition.definition,
                  };
                }
              }
              // see if you can find a verb and example
              if (m.partOfSpeech === "verb") {
                const foundExample = m.definitions.find((d: any) => d.example);
                if (foundExample) {
                  finalResVerbExample = { example: foundExample.example };
                  break outerLoop;
                }
              }
            }
          }
        }
      }

      let finalValue = finalResVerbExample
        ? finalResVerbExample
        : finalResDefinition;
      if (!finalValue) {
        throw new NotFound(
          "Word found but example or definition not found for this word"
        );
      }

      res.status(200).json(finalValue);
    } catch (e) {
      next(e);
    }
  }
);

// PART 2: number-to-word - Receives a single digit (from 0-9) and returns the word ("zero","one"..."nine") of that number in english.
// Ensure an appropriate RESTful return code is produced for valid and invalid input.
// Sample input: { "num": 7 }, this is a POST
app.post(
  "/number-to-word",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as NumberToWordDTO;
      const isSingleDigit = (num: any) => {
        return (
          typeof num === "number" &&
          Number.isInteger(num) &&
          num >= 0 &&
          num <= 9
        );
      };
      if (!isSingleDigit(body.num)) {
        throw new BadRequest(
          'Please enter a digit between 0 and 9 inclusive. Sample input: { "num": 7 }'
        );
      }

      const numbers = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
      ];

      res.status(200).json(numbers[body.num]);
    } catch (e: any) {
      next(e);
    }
  }
);

// PART 3: who-made-me - Return a string identifying who created the project and a fun fact about you. This is a GET.
app.get(
  "/who-made-me",
  async (_: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        creator: "Michael Hyde-de Sousa",
        funFact: "I have seen 1030 movies.",
      });
    } catch (e) {
      next(e);
    }
  }
);

// error handler
app.use(
  (
    error: HttpError,
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const status = error.status || 500;
    response.status(status).send({ message: error.message });
  }
);

app.all("*", (req: Request, res: Response) => {
  res.status(404).send({ message: "Endpoint not found" });
});

export { app, server };
