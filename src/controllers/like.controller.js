import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"Video id required")
    }
    //TODO: toggle like on video
    const video = await Like.findOne({video:videoId,likedBy: req.user?._id});
    if(!video){
        const videoLike = await Like.create({
            likedBy : req.user?._id,
            video : videoId,
            like : true
        })
        if(!videoLike){
            throw new ApiError(500,"Error while liking video")
        }
        res.status(200)
        .json(new ApiResponse(200,videoLike,"Video liked successfully"))
    }
    video.like = !video.like;
    await video.save();
    res.status(200)
        .json(new ApiResponse(200,video,"Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400,"Comment id required")
    }
    //TODO: toggle like on comment
    const comment = await Like.findOne({comment:commentId,likedBy: req.user?._id});
    if(!comment){
        const commentLike = await Like.create({
            likedBy : req.user?._id,
            comment : commentId,
            like : true
        })
        if(!commentLike){
            throw new ApiError(500,"Error while liking video")
        }
        res.status(200)
        .json(new ApiResponse(200,commentLike,"Video liked successfully"))
    }
    comment.like = !comment.like;
    await comment.save();
    res.status(200)
        .json(new ApiResponse(200,comment,"Video liked successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400,"Tweet id required")
    }
    //TODO: toggle like on tweet
    const tweet = await Like.findOne({tweet:tweetId,likedBy: req.user?._id});
    if(!tweet){
        const tweetLike = await Like.create({
            likedBy : req.user?._id,
            tweet : tweetId,
            like : true
        })
        if(!tweetLike){
            throw new ApiError(500,"Error while liking video")
        }
        res.status(200)
        .json(new ApiResponse(200,tweetLike,"Video liked successfully"))
    }
    tweet.like = !tweet.like;
    await tweet.save();
    res.status(200)
        .json(new ApiResponse(200,tweet,"Video liked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideos = await Like.aggregate([
        {
            $match : {
                video : {$ne :null},
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                like : true
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "video",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                ]
            }
        }
    ])

    res.status(200)
    .json(new ApiResponse(200,likedVideos,"Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}