import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    credentials : true,
    origin: process.env.ALLOWED_PATH
}));

app.use(express.static("public"));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.json({limit:"16kb"}));
app.use(cookieParser());

import userRoute from "./routes/user.route.js"
import videoRoute from "./routes/video.route.js"
import commentRoute from "./routes/comment.route.js"
import likeRoute from "./routes/like.route.js"
import subscribeRoute from "./routes/subscriptipon.route.js"
import dashboardRoute from "./routes/dashboard.route.js"
import playlistRoute from "./routes/playlist.route.js"

app.use("/api/v1/user",userRoute);
app.use("/api/v1/video",videoRoute);
app.use("/api/v1/comment",commentRoute);
app.use("/api/v1/like",likeRoute);
app.use("/api/v1/subscribe",subscribeRoute);
app.use("/api/v1/dashboard",dashboardRoute);
app.use("/api/v1/playlist",playlistRoute);

export {app};