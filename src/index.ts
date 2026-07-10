import app from "./app.ts";
import { PORT } from "./configs/index.ts";
import { connectDB } from "./database/mongodb.ts";
import http from "http";
import { initializeSocket } from "./realtime/socket.ts";

//server part
async function startServer(){
    await connectDB();
    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(
        PORT,
        () =>{
            console.log(`Server: http://localhost:${PORT}`);
        }
    )
}

startServer();
