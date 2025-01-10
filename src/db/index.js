import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"


const dbConnect = async ()=>{
    try {
        let db = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Database connected , DB HOST : ", db.connection.host);
    } catch (error) {
        console.log("DATABASE connection Failed ",error);
        process.exit(1);
    }
}

export default dbConnect;