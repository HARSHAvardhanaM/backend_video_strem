import mongoose, { isValidObjectId, Schema } from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { uploadImage } from "../utils/Cloudinary.config.js"
import cloudinary from "cloudinary"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortType, userId } = req.query;

    if ([sortBy, sortType, userId].some((val) => val.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" } 
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            }
        }
    ];

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const paginatedVideos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    if (!paginatedVideos || paginatedVideos.length === 0) {
        throw new ApiError(400, "Videos not found");
    }

    res.status(200)
        .json(new ApiResponse(200, paginatedVideos.docs, "Videos fetched successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body

    if ([title, description, isPublished].some((val) => !val || val.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }


    const videoCloud = await uploadImage(req.files.videoFile[0].path);
    const thumbnailCloud = await uploadImage(req.files.thumbnail[0].path);

    if (!videoCloud || !thumbnailCloud) {
        throw new ApiError(500, "Something went wrong while uploading video to cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        isPublished,
        videoFile: videoCloud.url,
        thumbnail: thumbnailCloud.url,
        owner: req.user._id,
        duration: Math.floor(videoCloud.duration)
    })

    res.status(200)
        .json(new ApiResponse(200, video, "Video saved sccessfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!(isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid video Id")
    };
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                        $match : {
                            like : true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "likedBy",
                            foreignField: "_id",
                            as: "likedBy",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "comments",
                foreignField: "video",
                localField: "_id",
                as: "comments",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "comment",
                            as: "likes"
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likes_total : {$size : "$likes"},
                comments_total : {$size : "$comments"},
            }
        }
    ]);

    if (!video) {
        throw new ApiError(400, "Invalid video ID")
    }

    res.status(200)
        .json(
            new ApiResponse(200, video, "Video file fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body;
    if(!title && !description){
        throw new ApiError(400,"Any one of the field is required");
    }
    if(!(isValidObjectId(videoId))){
        throw new ApiError(400,"Invalid ID")
    };

    const video = await Video.findByIdAndUpdate(videoId,{
        $set :{title , description}
    },{new : 1})


    if(!video){
        throw new ApiError(400,"Invalid videoID")
    }

    res.status(200)
    .json(new ApiResponse(200,video,"Video updated Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!(isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid video Id")
    };
    const video = await Video.findByIdAndDelete(videoId);
   
    cloudinary.uploader.destroy(`youtube_backend/${video.videoFile.split('/').pop().split('.').shift()}`, { resource_type: 'video' }, function(error, result) {
        if (error) {
          console.error('Error deleting video:', error);
        } else {
          console.log('Video deleted successfully:', result);
        }
      });


    const videoDel1 = await cloudinary.v2.api
    .delete_resources([`youtube_backend/${video.videoFile.split('/').pop().split('.').shift()}`], { type: 'upload', resource_type: 'video' })

    const videoDel2 = await cloudinary.uploader.destroy(`youtube_backend/${video.thumbnail.split('/').pop().split('.').shift()}`)

    if (!video) {
        throw new ApiError(400, "Invalid video Id / video not found")
    }

    res.status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!(isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid video Id")
    };
    const video = await Video.findById(videoId);

    video.isPublished = !(video.isPublished);

    const updatedVideo = await video.save();

    res.status(200)
        .json(new ApiResponse(200,updatedVideo.isPublished, "Toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}