import express, { Application,Request, Response } from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { HttpError } from "./errors/http-error.ts";

dotenv.config();
console.log(process.env.PORT);

const app: Application = express();

let corsOptions = {
    origin: ["http://localhost:3000"]
}

app.use(cors(corsOptions));

app.use((err: Error, req: Request, res: Response, next: Function) => {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

export default app;