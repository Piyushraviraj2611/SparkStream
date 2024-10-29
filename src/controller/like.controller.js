import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //fist find if video is liked or not
    //then toggle like on video
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const userid = req.user?._id
   const isLiked = await Like.findOne({
       video:videoId,
       likedBy:userid
   })

   if(isLiked){
    await Like.findByIdAndDelete(isLiked._id)
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video unliked successfully"
    ))
   }


   const like = await Like.create({
      video:videoId,
      likedBy:userid
   })

   if(!like){
    throw new ApiError(500, "Problem while liking video")
   }

   return res
   .status(201)
   .json(new ApiResponse(
       201,
       {like},
       "Video liked successfully"
   ))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }

    const userid = req.user?._id
   const isLiked = await Like.findOne({
       comment:commentId,
       likedBy:userid
   })

   if(isLiked){
    await Like.findByIdAndDelete(isLiked._id)
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Comment unliked successfully"
    ))
   }


   const like = await Like.create({
      comment:commentId,
      likedBy:userid
   })

   if(!like){
    throw new ApiError(500, "Problem while liking Comment")
   }

   return res
   .status(201)
   .json(new ApiResponse(
       201,
       {like},
       "Comment liked successfully"
   ))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet Id")
    }

    const userid = req.user?._id
   const isLiked = await Like.findOne({
       tweet:tweetId,
       likedBy:userid
   })

   if(isLiked){
    await Like.findByIdAndDelete(isLiked._id)
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Tweet unliked successfully"
    ))
   }


   const like = await Like.create({
      tweet:tweetId,
      likedBy:userid
   })

   if(!like){
    throw new ApiError(500, "Problem while liking Tweet")
   }

   return res
   .status(201)
   .json(new ApiResponse(
       201,
       {like},
       "Tweet liked successfully"
   ))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userid = req.user?._id

    const allLikedVideo = await Like.find({
        likedBy:userid,
        video: { $ne: null } // $ne means not equal
    }).populate("video")

    if(!allLikedVideo || allLikedVideo.length === 0){
        throw new ApiError(404, "No videos found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {allLikedVideo},
        "Liked videos fetched successfully"
    ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}