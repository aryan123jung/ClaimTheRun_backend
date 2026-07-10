import express, { Application,Request, Response } from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { HttpError } from "./errors/http-error.ts";
import authRoutes from "./routes/auth.routes.ts";
import postRoutes from "./routes/post.routes.ts";
import friendRoutes from "./routes/friend-request.routes.ts";
import notificationRoutes from "./routes/notification.routes.ts";
import bodyParser from 'body-parser';

dotenv.config();
console.log(process.env.PORT);

const app: Application = express();
const requestBodyLimit = '10mb';

app.use(cors());

app.use(bodyParser.json({ limit: requestBodyLimit }));
app.use(bodyParser.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);



app.use((err: Error, req: Request, res: Response, next: Function) => {
    if ((err as Error & { type?: string }).type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Request body exceeds the 10 MB upload limit',
        });
    }
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

export default app;
