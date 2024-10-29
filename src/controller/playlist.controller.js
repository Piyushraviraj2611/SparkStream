import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    // console.log("name" , name)
    // console.log("desc",description);
    
    
    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(404, "unauthorized request")
    }
    const playList = await Playlist.create({
        name,
        description,
        owner: user,
        videos:[]
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            {playList},
            "Playlist created successfully"
        ))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "User Id is not valid");
    }
    
    const user = await User.findById(userId).select("-password -refreshToken")
    if(!user){
        throw new ApiError(404, "unauthorized request")
    }
    const playlists = await Playlist.find({owner: user})

    if (!playlists.length) {
        throw new ApiError(404, "No playlists found for this user");
    }
    
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {playlists},
            "Playlists fetched successfully"
        ))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist Id is not valid");
    }
     
    const playList = await Playlist.findById(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {playList},
            "Playlist fetched successfully by PlaylistId"
        ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

// console.log("playlistId", playlistId);
// console.log("videoId", videoId);

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        { new: true } 
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {updatedPlaylist},
            "Video added to playlist successfully"
        ))


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos: videoId
            }
        },
        { new: true }

    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {updatedPlaylist},
            "Video removed from playlist successfully"
        ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    return res  
        .status(200)
        .json(new ApiResponse(
            200,
            {playlist},
            "Playlist deleted successfully"
        ))


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {updatedPlaylist},
            "Playlist updated successfully"
        ))
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