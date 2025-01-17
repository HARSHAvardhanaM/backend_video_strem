import asyncHandler from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadImage } from "../utils/Cloudinary.config.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

let generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        let user = await User.findById(userId);
        let accessToken = user.generateAccessToken();
        let refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh Token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
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
    if ([username, email, password, fullName].some(val => val?.trim() === "")) {
        throw new ApiError(401, "All fields are required")
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
        throw new ApiError(409, "User with provided email or username already exists")
    }

    // console.log(req.files);

    const avatarLocalFile = req.files?.avatar[0]?.path;
    let coverImageLocalFile;

    if (req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalFile = req.files?.coverImage[0]?.path
    }

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatarCloudinary = await uploadImage(avatarLocalFile);
    let coverImageCloudinary = await uploadImage(coverImageLocalFile);

    if (!avatarCloudinary) {
        throw new ApiError(400, "Avatar is required")
    }


    let user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatarCloudinary?.url,
        coverImage: coverImageCloudinary?.url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // console.log(createdUser)

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd Successfully")
    )

});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "All fields are required")
    }

    let user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "Invalid username or email")
    }

    let isPasswordCorrect = await user.checkPassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password")
    }

    let { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    let loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    let options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(201, {
            user: loggedInUser, accessToken, refreshToken,
        }, "User loggedin successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    let user = req.user;
    await User.findByIdAndUpdate(user._id, {
        $unset: {
            refreshToken: 1
        }
    },
        {
            new: true
        });

    let options = {
        httpOnly: true,
        secure: true
    };

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(201, {}, "User logged out successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const options = {
        secure: true,
        httpOnly: true
    }

    const reqRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!reqRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(reqRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(400, "Invalid Refresh Token")
        }

        // console.log(user.refreshToken)
        // console.log("     ")
        // console.log(reqRefreshToken)

        if (reqRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, "Request token is expired or used")
        }

        let { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        res.status(200)
            .cookie("refreshToken", refreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(201, {
                    accessToken, refreshToken
                }, "Token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.checkPassword(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    // const updatedUser = await User.findByIdAndUpdate(user._id, {
    //     $set: { password: newPassword }
    // }, {
    //     new: true,
    //     validateBeforeSave: false
    // }
    // ).select("-password - refreshToken");
    res.status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200)
        .json(new ApiResponse(200, { user: req.user }, "User fetched successfully"))
})

const updateAccount = asyncHandler(async (req, res) => {
    let { fullName, email } = req.body;
    if (!fullName && !email) {
        throw new ApiError(400, "Fullname or email is required")
    }
    let updatedUser = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            fullName,
            email
        }
    },
        {
            new: true
        }
    ).select("-password -refreshToken");

    res.status(200)
        .json(new ApiResponse(200, updatedUser, "User updated successfully"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    let avatarLocalPath = req.file.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Invalid file / No file")
    }

    let avatarCloudinary = await uploadImage(avatarLocalPath);

    if (!avatarCloudinary?.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    let user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatar: avatarCloudinary.url
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    res.status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateCoverImg = asyncHandler(async (req, res) => {
    let coverImgLocalPath = req.file.path;
    if (!coverImgLocalPath) {
        throw new ApiError(400, "Invalid file / No file")
    }

    let coverImg = await uploadImage(coverImgLocalPath);

    if (!coverImg?.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    let user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage: coverImg.url
        }
    }, {
        new: true
    }).select("-password -refreshToken")

    res.status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})

const getUserChannelDetails = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fllName: 1,
                email: 1,
                channelsSubscribedToCount: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImg: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel doesnot exists")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})

const getUserWatchHistory = asyncHandler(async (req, res) => {
    let user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "watchHistory",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ]
            },

        }
    ]);

    res.status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "User watch histoy fetched successfully"))
})


export {
    registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccount,
    updateAvatar, updateCoverImg, getUserChannelDetails, getUserWatchHistory
}