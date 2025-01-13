import asyncHandler from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadImage} from "../utils/Cloudinary.config.js"

const registerUser = asyncHandler(async (req, res, next) => {
    // get input from frontend
    // check for empty fields [validation]
    // check if user already exists
    // get avatar, coverImg from file
    // check for files
    // upload them to cloudinary
    // create user obj in db
    // remove password refreshToken from user
    // check for user 
    //  send response

    const { username, email, password, fullName } = req.body;

    if([username,email,password,fullName].some(val=>val?.trim() === "")){
        throw new ApiError(401,"All fields are required")
    }

    const existingUser = await User.findOne({$or : [{email},{username}]});
    
    if(existingUser){
        throw new ApiError(409,"User with provided email or username already exists")
    }

    // console.log(req.files);

    const avatarLocalFile = req.files?.avatar[0]?.path;
    let coverImageLocalFile;

    if(req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalFile = req.files?.coverImage[0]?.path
    }

    if(!avatarLocalFile){
        throw new ApiError(400,"Avatar is required")
    }

    const avatarCloudinary = await uploadImage(avatarLocalFile);
    let coverImageCloudinary = await uploadImage(coverImageLocalFile);

    if(!avatarCloudinary){
        throw new ApiError(400,"Avatar is required")
    }


    let user =await User.create({
        username : username.toLowerCase(),
        email,
        password,
        fullName,
        avatar : avatarCloudinary?.url,
        coverImage : coverImageCloudinary?.url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // console.log(createdUser)

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating user")
    }

    res.status(201).json(
        new ApiResponse(200,createdUser,"User registerd Successfully")
    )

    res.send(req.file)


});


export { registerUser }