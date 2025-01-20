import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params;
    if (!(isValidObjectId(channelId))) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViewsOfChannels: {
                    $sum: "$views"
                },
                totalVideos : {
                    $sum : 1
                }
            }
        },
        {
            $project: {
                _id: 0
            }
        }
    ]);

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,

            }
        }
    ]);

    const likes = await Like.aggregate([
        {
            $match: {
                video: { $ne: null },
                like: true
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $match: {
                            owner: new mongoose.Types.ObjectId(channelId)
                        }
                    }, {
                        $project: {
                            _id: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: {
                    $first: "$video"
                }
            }

        },
        {
            $match: {
                video: { $ne: null }
            }
        }
    ])

    const data = {
        channelOwner : req.user.username,
        totalLikes : (likes && likes?.length) || 0,
        totalViews : (videos && videos[0]?.totalViewsOfChannels) || 0,
        totalSubscribers : (subscribers && subscribers[0]?.totalSubscribers) || 0,
        totalVideos : (videos && videos[0]?.totalVideos) || 0
    }

    res.status(200)
    .json(new ApiResponse(200,data,"Data fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params
    if (!(isValidObjectId(channelId))) {
        throw new ApiError(400, "Invalid channelId")
    }
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
                pipeline: [
                    {
                        $match: {
                            like: true
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                commentsCount: {
                    $size: "$comments"
                }
            }
        }
    ]);
    res.status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}