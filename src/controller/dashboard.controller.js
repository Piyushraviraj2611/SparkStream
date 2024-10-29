import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // console.log("Hello");

    const user = req.user?._id;
    // console.log("user", user);


    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: user
            }
        },
        // Lo0king for subscriber
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "subscriber",
                as: "subscribers"
            }

        },
        // Looking for SubscribedTo
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribedTo"
            }
        },
        // Looking for Likes
        {

            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video"  // count the number of times video appear in Like Schema 
                //means numbers of like of perticular video that has _id
                // or find({ video._id =_id})
                , as: "videosLikes"
            }
        },
        //Looking for total Comment for user Video
        {

            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "videosComments"
            }
        },
        // Looking for total Tweets by user
        {
            $lookup: {
                from: "tweets",
                localField: "owner",
                foreignField: "owner",
                as: "tweets"
            }
        },

        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                 totalViews: { $sum: "$views" },
                totalComments: { $sum: "$videosComments" },
                totalTweets: { $sum: "$tweets" },
                totalLikes: { $sum: "$videosLikes" },
                subscribers: { $first: "$subscribers" },
                subscribedTo: { $first: "$subscribedTo" },
            }
        },

        {
            $project: {
                totalComments: 1,
                totalTweets: 1,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
                subscribers: { $size: "$subscribers" },
                subscribedTo: { $size: "$subscribedTo" },
            }
        }
    ])


    // console.log("channel Stats", channelStats);

    if (!channelStats) {
        throw new ApiError(404, "Something Wrong while Channel Stats")
    }

    res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelStats[0],
                "Channel stats fetched successfully"
            )
        );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    //  Get all the videos uploaded by the channel
    const user = req.user?._id;

    const allVideo = await Video.find({
        owner: user
    })

    if (!allVideo || allVideo.length == 0) {
        throw new ApiError(400, "No Videos Found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            allVideo,
            "Videos Fetched Successfully"
        ))

})

export {
    getChannelStats,
    getChannelVideos
}