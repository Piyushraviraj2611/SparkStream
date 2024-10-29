import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "unauthorized request")
    }

    const comment = await Comment.create({
        content,
        owner: user,
        video: videoId
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            { comment },
            "Comment created successfully"
        ))
})

const updateComment = asyncHandler(async (req, res) => {
   

    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(

        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

  return res
    .status(200)
    .json(new ApiResponse(
        200,
        { updatedComment },
        "Comment updated successfully"
    ))

})


const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    return res  
        .status(200)
        .json(new ApiResponse(
            200,
            {deletedComment},
            "Comment deleted successfully"
        ))
})

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page=1, limit=5 } = req.query  //default value  for custom /:videoId?page=2&limit=3

    // console.log("page", page);
    // console.log("limit", limit);
    

const comments = await Comment.find({video:videoId})
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })

return res
    .status(200)
    .json(new ApiResponse(
        200,
        { comments },
        "Comments fetched successfully"
    ))

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}