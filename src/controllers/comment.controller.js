import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const aggregationPipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",          
                foreignField: "comment",     
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",       
                foreignField: "_id",        
                as: "owner",
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
        {
            $addFields: {
                likesCount: { $size: "$likes" },   
                owner: { $arrayElemAt: ["$owner", 0] },
                isLiked : {
                    $cond : {
                        if : {$in : [new mongoose.Types.ObjectId(req.user?._id), "$likes"]},
                        then : true,
                        else : false
                    }
                }  
            }
        }
    ];

    const options = {
        page: parseInt(page, 10), 
        limit: parseInt(limit, 10) 
    };

    const paginatedComments = await Comment.aggregatePaginate(aggregationPipeline, options);

    if (!paginatedComments || paginatedComments.length === 0) {
        throw new ApiError(404, "No comments found");
    }

    res.status(200)
    .json(new ApiResponse(200, (paginatedComments), "comments fetcehed successfully"))
            
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const { content } = req.body;
    if (!(isValidObjectId(videoId))) {
        throw new ApiError(400,"Invalid video id")
    }
    if([videoId,content].some((val)=>val.trim() === "")){
        throw new ApiError(400,"All fields are required to create comment")
    }
    const comment = new Comment({
        content : content,
        video : videoId,
        owner : req.user._id
    });
    await comment.save();
    res.status(200)
    .json(new ApiResponse(200,comment,"Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if (!(isValidObjectId(commentId))) {
        throw new ApiError(400,"Invalid comment id")
    }
    if([commentId,content].some((val)=>val.trim() === "")){
        throw new ApiError(400,"All fields are required to update")
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if(!(comment.owner.equals(req.user._id))){
        console.log(comment.owner , req.user._id)
        throw new ApiError(401,"You are not authorized to make changes in this comment")
    }
    comment.content = content;
    await comment.save();
    res.status(200)
    .json(new ApiResponse(200,comment,"Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    console.log(commentId)
    if(!commentId){
        throw new ApiError(400,"CommentId is required")
    }
    if (!(isValidObjectId(commentId))) {
        throw new ApiError(400,"Invalid comment id")
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,"Comment not found")
    }
    if(!(comment.owner.equals(req.user._id))){
        throw new ApiError(401,"You are not the owner of this comment")
    }
    const delComment = await Comment.findByIdAndDelete(commentId)
    if(!delComment){
        throw new ApiError(500,"Something went wrong while deleting comment")
    }
    res.status(200)
    .json(new ApiResponse(200,{},"Comment deletd successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }