import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    console.log("channelId",channelId);
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Channel Id is not Valid")
    }

    const isSubscribed = await Subscription.find({
        channel:channelId,
        subscriber:req.user?._id
    })

    // console.log("isSubscribed",isSubscribed);
    
    if(isSubscribed.length!=0){
        await Subscription.deleteOne()
        return res.status(200).json(new ApiResponse(200, {}, "Subscription Removed Successfully"))
    }
   
        const subscription = await Subscription.create({
            channel:channelId,
            subscriber:req.user?._id
        })
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {subscription},
        "Congratulation!! You have Successfully Subscribed this channel"
    ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Channel Id is not Valid")
    }

    const subscriber = await Subscription.find({subscriber:subscriberId}).populate("channel", "fullName email username avatar coverImage");

    if(!subscriber){
        throw new ApiError(404,"Subscription not found")
    }

    return res
        .status(200)    
        .json(new ApiResponse(
            200,
            {subscriber},
            "Subscribers fetched successfully"
        ))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Subscriber Id is not Valid")    
    }

    const subscribedTo = await Subscription.find({
        channel:channelId}).populate("subscriber", "fullName email username avatar coverImage");
        
    if(!subscribedTo.length){
        return res
        .status(202)
        .json(new ApiResponse(
            202,
            {subscribedTo},
            "No Subscription found"))
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {subscribedTo},
            "Subscribed channels fetched successfully"
        ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}