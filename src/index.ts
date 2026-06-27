import app from "./app.js";
import { PORT } from "./configs/index.js";
import { connectDB } from "./database/mongodb.js";
import http from "http";

//server part
async function startServer(){
    await connectDB();
    const server = http.createServer(app);

    server.listen(
        PORT,
        () =>{
            console.log(`Server: http://localhost:${PORT}`);
        }
    )
}

startServer();
