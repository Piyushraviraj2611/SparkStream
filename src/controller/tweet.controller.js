import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Tweet } from '../models/tweet.model.js'
import { User } from '../models/user.model.js'
import { uplodeOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const createTweet = asyncHandler(async (req, res) => {

    // take content from user
    // validate content
    // if file present  then upload on cloudinary
    // save tweet in database
    // return response.

    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    // console.log("content", content);

    const fileLocalPath = req.file?.path

    // console.log(fileLocalPath);

    let file
    if (fileLocalPath) {
        file = await uplodeOnCloudinary(fileLocalPath);
    }

    const user = await User.findById(req.user._id).select(
        "-password -refreshToken"    // minus represent deselect
    )

    if (!user) {
        throw new ApiError(500, "Somethind went wrong while registering the user")
    }

    const tweet = await Tweet.create({
        content,
        owner: user,
        file: file?.url || ""
    })
    console.log("file", file);


    return res
        .status(201)
        .json(new ApiResponse(
            201,
            tweet,
            "Tweet created successfully"
        ))






})

const getUserTweets = asyncHandler(async (req, res) => {


    const user = await User.findById(req.user._id).select(
        "-password -refreshToken"    // minus represent deselect
    )
    if (!user) {
        throw new ApiError(401, "Unauthorized request")
    }

    const tweet = await Tweet.find({ owner: user })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { tweet, user },
            "Tweets fetched successfully"
        ))
})

const updateTweetContent = asyncHandler(async (req, res) => {

    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    // const user = await Tweet.findById(req.user._id).select(
    //     "-password -refreshToken"    // minus represent deselect
    // )

    // if(!user){
    //     throw new ApiError(401,"Unauthorized request")
    // }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },

        { new: true })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        ))
})


const updateTweetFile = asyncHandler(async (req, res) => {

    const fileLocalPath = req.file?.path
    const { tweetId } = req.params;

    console.log("fileLocalPath", fileLocalPath);
    console.log("tweetId", tweetId);



    if (!fileLocalPath) {
        throw new ApiError(400, "File is required")
    }

    const file = await uplodeOnCloudinary(fileLocalPath);

    const updatedfile = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                file: file.url
            }
        },

        { new: true })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedfile,
            "Tweet updated successfully"
        ))

})

const deleteTweet = asyncHandler(async (req, res) => {

    const {tweetId} = req.params

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        "Tweet deleted Successfully"
    ))
})



export {
    createTweet,
    getUserTweets,
    updateTweetContent,
    updateTweetFile,
    deleteTweet

}