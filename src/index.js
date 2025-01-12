import dotenv from "dotenv";
import {app} from "./app.js";
import dbConnect from "./db/index.js";
dotenv.config({
    path : "/env"
})


dbConnect()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Database connection failed : ",error)
    });
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App is listening on `, process.env.PORT)
    })
})
.catch((error)=>{console.log("Database connection failed ",error)})

























// ;(async ()=> {
//     try {
//         const dbVal = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.log("ERROR : ",error);
//             throw error;
//         });
//         app.listen(process.env.PORT,()=>{
//             console.log("App is listening on ",process.env.PORT)
//         })
//     } catch (error) {
//         console.error("ERROR : ",error);
//         throw error
//     }
// })()
