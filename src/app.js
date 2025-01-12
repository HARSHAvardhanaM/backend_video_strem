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

app.use("/api/v1/user",userRoute)

export {app};