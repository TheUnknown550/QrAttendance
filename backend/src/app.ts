import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import morgan from "morgan";
import { corsOrigins } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { router } from "./routes";

export const app = express();

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    fallthrough: false,
    index: false,
    maxAge: "30d",
    immutable: true,
    setHeaders: (response) => {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      response.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'none'; sandbox");
    },
  }),
);

app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandler);
