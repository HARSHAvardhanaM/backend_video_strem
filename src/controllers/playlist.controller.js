import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    if([name,description].some(val=>val.trim()==="")){
        throw new ApiError(400,"Every field is required")
    }
    const playlist = await Playlist.findOne({name : name});
    if(playlist){
        throw new ApiError(400,"Playlist with the name already exists")
    }
    const newPlaylist = await Playlist.create({
        name : name,
        description : description,
        owner : req.user._id,

    });
    if(!newPlaylist){
        throw new ApiError(500,"Something went wrong while creating playlist")
    }
    res.status(200)
    .json(new ApiResponse(200,newPlaylist,"Playlist created successfully"))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!(isValidObjectId(userId))){
        throw new ApiError(400,"Invalid Id")
    };
    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        $match : {
                            isPublished : true
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        avatar : 1,
                                        username : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    // console.log(playlists)
    if(!playlists){
        throw new ApiError(404 , "Playlist not found")
    }
    return res.status(200)
    .json(new ApiResponse(200,playlists,"Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!(isValidObjectId(playlistId))){
        throw new ApiError(400,"Invalid Id")
    };
    const playlist = await Playlist.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        $match : {
                            isPublished : true
                        }
                    },
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        avatar : 1,
                                        username : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        },
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
        {
            $addFields : {
                owner : {
                    $first : "$owner"
                }
            }
        }
    ]);
    if(!playlist){
        throw new ApiError(404,"Playlist not found/Invalid playlist id")
    };
    res.status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    if([playlistId, videoId].some(val => typeof val !== 'string' || val.trim() === "")){
        throw new ApiError(400,"Any one field is required")
    }
    if(!(isValidObjectId(playlistId)) || !(isValidObjectId(videoId))){
        throw new ApiError(400,"Invalid playlist Id or video Id")
    };
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    if(playlist.videos.includes(videoId)){
        throw new ApiError(409,"Video already exists in the playlist")
    }
    playlist.videos.push(videoId);
    const updatePlaylist = await playlist.save()
    if(!updatePlaylist){
        throw new ApiError(500,"Something went wrong while adding video")
    }
    res.status(200)
    .json(new ApiResponse(200,updatePlaylist,"Playlist updated successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if([playlistId, videoId].some(val => typeof val !== 'string' || val.trim() === "")){
        throw new ApiError(400,"Any one field is required")
    }
    if(!(isValidObjectId(playlistId)) || !(isValidObjectId(videoId))){
        throw new ApiError(400,"Invalid playlist Id or video Id")
    };
    const playlist = await Playlist.findById(playlistId);
    if(!(playlist.videos.includes(videoId))){
        throw new ApiError(400,"Video not found in playlist");
    }
    if(!playlist || playlist.videos.length === 0){
        throw new ApiError(400,"Playlist not found / No videos in playlist");
    };
    const playlistUpdated = await Playlist.findByIdAndUpdate(playlistId,{
        $pull : {
            videos : videoId
        }       
    },{new : true})
    res.status(200)
    .json(new ApiResponse(200,playlistUpdated,"Video removed successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!(isValidObjectId(playlistId))){
        throw new ApiError(400,"Invalid playlist Id")
    };
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"Playlist not found");
    };
    const updatedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    res.status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!name && !description){
        throw new ApiError(400,"Any one field is required")
    }
    //TODO: update playlist
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"Playlist not found");
    };
    const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId,{$set : {
        name , description
    }},{new : true});
    if(!updatePlaylist){
        throw new ApiError(404,"Playlist not found")
    };
    res.status(200)
    .json(new ApiResponse(200,updatePlaylist,"Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}