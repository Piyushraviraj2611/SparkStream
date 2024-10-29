import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uplodeOnCloudinary } from '../utils/cloudinary.js'

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    console.log("videoLocalPath", videoLocalPath);
    console.log("thumbnailLocalPath", thumbnailLocalPath);


    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const video = await uplodeOnCloudinary(videoLocalPath);
    const thumbnail = await uplodeOnCloudinary(thumbnailLocalPath);


    if (!video || !thumbnail) {
        throw new ApiError(500, "Problem while uploading Video and thumbnail")
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "unauthorized request")
    }

    const videoDoc = await Video.create({
        title,
        description,
        video: video.url,
        thumbnail: thumbnail.url,
        owner: user,
        duration: video.duration || 0,
        isPublished: true,
        views: 0
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            { videoDoc },
            "Video published successfully"
        ))

})



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // get all videos based on query, sort, pagination

    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "unauthorized request")
    }

    const allVideos = await Video.find({
        $or: [
            {
                $and: [
                    { isPublished: true }, { owner: user },
                    {
                        $or: [{ title: { $regex: query || "", $options: "i" } },
                        { description: { $regex: query || "", $options: "i" } }]
                    }
                ]
            }, 
            {
                query: "", // if Query is empty then fetch all videos
            }
        ]

    })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ [sortBy || "createdAt"]: sortType || "desc" });

    if (allVideos.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                [],
                "No videos found"
            ))
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            allVideos,
            "All Videos Fetched Successfully"
        ))
})

// With Pipeline...
// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     // get all videos based on query, sort, pagination

//     var videoAggregate;
//     try {
//         videoAggregate = Video.aggregate(
//             [
//                 {
//                     $match: {
//                         $or: [
//                             { title: { $regex: query, $options: "i" } },
//                             { description: { $regex: query, $options: "i" } }
//                         ]
//                     }

//                 },
//                 {
//                     $lookup: {
//                         from: "users",
//                         localField: "owner",
//                         foreignField: "_id",
//                         as: "owner",
//                         pipeline: [
//                             {
//                                 $project: {
//                                     _id :1,
//                                     fullName: 1,
//                                     avatar: "$avatar.url",
//                                     username: 1,
//                                 }
//                             },

//                         ]
//                     }
//                 },

//                 {
//                     $addFields: {
//                         owner: {
//                             $first: "$owner",
//                         },
//                     },
//                 },

//                 {
//                     $sort: {
//                         [sortBy || "createdAt"]: sortType || 1
//                     }
//                 },

//             ]
//         )
//     } catch (error) {
//         // console.error("Error in aggregation:", error);
//         throw new ApiError(500, error.message || "Internal server error in video aggregation");
//     }




//     const options = {
//         page,
//         limit,
//         customLabels: {
//             totalDocs: "totalVideos",
//             docs: "videos",

//         },
//         skip: (page - 1) * limit,
//         limit: parseInt(limit),
//     }

//     Video.aggregatePaginate(videoAggregate, options)
//         .then(result => {
//             // console.log("first")
//             if (result?.videos?.length === 0 ) {
//                 return res.status(200).json(new ApiResponse(200, [], "No videos found"))
//             }

//             return res.status(200)
//                 .json(
//                     new ApiResponse(
//                         200,
//                         result,
//                         "video fetched successfully"
//                     )
//                 )
//         }).catch(error => {
//             // console.log("error ::", error)
//             throw new ApiError(500, error?.message || "Internal server error in video aggregate Paginate")
//         })
// })


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "Video Fetched Successfully"
        ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //upload video
    const videoLocalPath = req.file?.path;

    if (!videoLocalPath) {
        throw new ApiError(404, "Video Not Found")
    }

    const updatedVideo = await uplodeOnCloudinary(videoLocalPath);

    if (!updatedVideo) {
        throw new ApiError(500, "Problem while uploading Video")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                video: updatedVideo.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            updatedVideo,
            "Video Updated Successfully"
        ))

})

const updateThumbnail = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(404, "Thumbnail not found")
    }

    const updatedThumbnail = await uplodeOnCloudinary(thumbnailLocalPath)

    if (!updatedThumbnail) {
        throw new ApiError(500, "Problem while uploading Thumbnail")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: updatedThumbnail.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            video,
            "Thumbnail Updated Successfully"
        ))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { deleteVideo },
            "Video deleted successfully"
        ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const prevVideo = await Video.findById(videoId)

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !prevVideo.isPublished
            }
        },
        { new: true } // return updated document
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { video },
            "Video published successfully"
        ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    updateThumbnail
}