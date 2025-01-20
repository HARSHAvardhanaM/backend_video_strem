import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import asyncHandler from "../utils/asyncHandler.js";

export const isPlaylistOwner = asyncHandler(async (req,_,next) => {
    const playlist = await Playlist.findById(req.params.playlistId);
    if(!playlist){
        return next(new ApiError(404, "playlist not found"));
    }
    if ( playlist.owner.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, "You are not the owner"));
    }
    next();
})
