import mongoose, { isValidObjectId, Schema } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!(isValidObjectId(channelId))){
        throw new ApiError(400,"Invalid channel Id")
    }
    const subscription = await Subscription.findOne({
        subscriber : req.user._id,
        channel : channelId});
    if(!subscription){
        const newSubscription = await Subscription.create({
            subscriber : req.user._id,
            channel : channelId
        });
        return res.status(200)
        .json(new ApiResponse(200,newSubscription,"Subscription added"))
    };
    await Subscription.findByIdAndDelete(subscription._id);
    res.status(200)
    .json(new ApiResponse(200,{},"Subscription removed successfully"));
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    const subscribers = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriber",
                pipeline : [
                    {
                        $project : {
                            _id : 0,
                            fullName :1,
                            avatar : 1
                        }
                    },
                ]
            }
        },
        {
            $addFields : {
               subscriber : {
                $first : "$subscriber"
               }
            }
        },
        { $project : {
            subscriber : 1,
            _id : 0
        }}
    ]);
    res.json(subscribers)
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    const channels = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channel",
                pipeline : [
                    {
                        $project : {
                            fullName :1,
                            avatar : 1
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
               channel : {
                $first : "$channel"
               }
            }
        },
        { $project : {
            channel : 1,
            _id : 0
        }}
    ]);
    res.json(channels)
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}