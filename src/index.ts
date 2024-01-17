import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { HttpError } from "http-errors";
import config from "../config";
import { data } from "./sample-data";
import cors from "cors";

dotenv.config({ path: ".env" });

const app: Express = express();
const port = config.PORT || 8000;

// request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.info(`${req.method} request to "${req.url}" by ${req.hostname}`);
  next();
});

app.use(cors());

// start the listener
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get("/styles", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(data);
  } catch (e) {
    next(e);
  }
});

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
