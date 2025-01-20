import asyncHandler from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"

export const jwtVerify = asyncHandler(async(req,_,next)=>{
    try {
        let jwtToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!jwtToken){
            throw new ApiError(401,"Unauthorised request")
        }
    
        let decodedToken  = jwt.verify(jwtToken,process.env.ACCESS_TOKEN_SECRET);
    
        let user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, error.message || "Invalid Access Token")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error.message || "Invalid Access Token")
    }
})