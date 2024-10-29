import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uplodeOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"
import mongoose from 'mongoose'


const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId);
      // console.log("user", user);

      const accessToken = await user.generateAccessToken();
      const refreshToken = await user.generateRefreshToken()

      user.refreshToken = refreshToken;
      // user.accessToken = accessToken;
      await user.save({ validateBeforeSave: false })  // so we didn't enter password or other stuff.

      return { accessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating Access or Refresh Token")
   }
}

const registerUser = asyncHandler(async (req, res) => {
   // get all details from frontend.
   // check all the validation.
   // check if user already exists: username,email
   //check for images and avatar
   // upload them to cloudinary, avatar
   // create user object - create entry in db
   // remove passowrd and refresh token from response.
   //check for user creation
   // return res

   const { fullName, userName, email, password } = req.body;
   // console.log("email: ", email);
   // console.log("password: ", password);

   // validation
   // if(fullName === "") throw new ApiError(400,"FullName is required")

   if ([fullName, userName, email, password].some((fields) => fields?.trim() === "")) {
      throw new ApiError(400, "Fill all details")
   }

   const existedUser = await User.findOne({
      $or: [{ userName }, { email }]
   })

   if (existedUser) {
      throw new ApiError(409, "User or email already exist")
   }

   //multer or middleware add in req.body
   const avatarLocalPath = req.files?.avatar[0]?.path  //multiple file so files


   // const coverImageLocalPath = req.files?.coverImage[0]?.path
   // same as.... in above when we give empty coverImage then it gives error of undefine so we do like this.
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
   }

   const avatar = await uplodeOnCloudinary(avatarLocalPath)
   const coverImage = await uplodeOnCloudinary(coverImageLocalPath)
   if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
   }

   //database entry

   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
      userName: userName.toLowerCase(),
      email,
   })
   // check does user is created or not. and remove password and refresh token
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"    // minus represent deselect
   )

   if (!createdUser) {
      throw new ApiError(500, "Somethind went wrong while registering the user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User Register Successfully")
   )

})

const loginUser = asyncHandler(async (req, res) => {
   // steps to be performed.
   // Take email id and password
   // validate does it empty ?
   // It email Id is pre exists or not 
   // If it is then check password
   // generate token 
   //send in cookies

   const { email, password, userName } = req.body;

   // console.log("email: ", email, "password: ", password, "userName: ", userName);

   //validation
   if (!email && !userName) {
      throw new ApiError(400, "Email Id or UserName is required ")
   }

   const existUser = await User.findOne({
      $or: [{ email }, { userName }]
   })
   console.log("existUser: ", existUser);

   if (!existUser) {
      throw new ApiError(404, "User Doesn't exist")
   }

   const isPasswordValid = await existUser.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Incorrect Password")
   }

   //Generate Access and Refresh Token...
   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existUser._id)

   // send cookies
   const loggedInUser = await User.findById(existUser._id).select("-password -refreshToken")


   const options = {
      httpOnly: true,  // only modifiable by server
      secure: true
   }

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
         )
      )

})

const logoutUser = asyncHandler(async (req, res) => {
   //Here is a problem that we didn't have user detail or id to logout so we use middleWare concept to add
   // We just simple use middleware to add user in req.body in auth.middleware.js
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refreshToken: 1 // this removes the field from document
         }
      },
      {
         new: true
      }
   )

   const options = {
      httpOnly: true,  // only modifiable by server
      secure: true
   }

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new ApiResponse(200,
            {},
            "User Logged Out")
      )
})

// RefreshAccessToken is basically generate new access token with old refresh token.

const refreshAccessToken = asyncHandler(async (req, res) => {

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   //  console.log("incomingRefreshToken: ", incomingRefreshToken);

   if (!incomingRefreshToken) {
      throw new ApiError(501, "Refresh Token is required")
   }

   try {
      const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
      // console.log("decodedToken: ", decodedToken);

      const user = await User.findById(decodedToken?._id)
      console.log("user: ", user);

      if (!user) {
         throw new ApiError(401, "Invalid Refresh Token")
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or used")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               { accessToken, refreshToken: newRefreshToken },
               "Access token refreshed"
            )
         )
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")

   }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body
   const userId = req.user?._id
   const user = await User.findById(userId);
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if (!isPasswordCorrect) {
      throw new ApiError(401, "Incorrect Password")
   }
   user.password = newPassword;
   await user.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            {}, //Data
            "Password change Successfully"
         )
      )
})

const getCurrentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(new ApiResponse(
         200,
         req.user,
         "User fetched successfully"
      ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, email } = req.body

   if (!fullName || !email) {
      throw new ApiError(400, "Fullname and email are required")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName: fullName,
            email
         }
      },
      { new: true }  // return updated value
   ).select("-password")

   // user.fullName = fullName
   // user.email = email

   // user.save()
   // user.select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            { user },
            "Account Details Update Scuccessfully"
         )
      )
})

const updateUserAvatar = asyncHandler(async (req, res) => {


   const avatarLocalPath = req.file?.path  // single file
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
   }

   const avatar = await uplodeOnCloudinary(avatarLocalPath)
   if (!avatar.url) {
      throw new ApiError(400, "Error while uploading")
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      { new: true } // return updated value
   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            { user },
            "Avatar Updated Scuccessfully"
         )
      )


})

const updateUserCoverImage = asyncHandler(async (req, res) => {


   const coverImageLocalPath = req.file?.path  // single file
   if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover Image file is missing")
   }

   const coverImage = await uplodeOnCloudinary(coverImageLocalPath)
   if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading")
   }
   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage :coverImage.url
         }
      },
      { new: true } // return updated value
   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            { user },
            "CoverImage Updated Scuccessfully"
         )
      )


})

const getUserChannelProfile = asyncHandler(async (req, res) => {

   const { userName } = req.params
   console.log("req.params", req.params);
   
   if (!userName?.trim()) {
      throw new ApiError(400, "Username is missing")
   }
   // const user = await User.find({userName})

   //Here Aggregation Pipelines...
   //Pipeline is basically filter means output of one stage is input of another stage.
   const channel = await User.aggregate(
      [
         {
            $match: {
               //Find the user which has userName in req.params
               userName: userName?.toLowerCase()
            }
         },
         //Second Stage.  How many subscribers are that user which was found in stage one.
         {
            $lookup: {
               // Lookup is used to find all element and add in document 
               from: "subscriptions", // name changed to Subscription = subscriptions because in  mongoDB store with that name
               localField: "_id",   //  matching field that present in Subscription model.
               foreignField: "channel", // in channel find _id which matched added in array or document.
               as: "subscribers"  // create array of this name.
            }
         },
         //Third stage. in this find how many subscribedTo
         {
            $lookup: {
               from: "subscriptions",
               localField: "_id",
               foreignField: "subscriber",  // find _id in subscriber.
               as: "subscribedTo"
            }
         },
         //Add in field.
         {
            $addFields: {
               subscriberCount: {
                  $size: "$subscribers"  // count the number of subscribers
               },
               channelSubscribedCount: {
                  $size: "$subscribedTo"
               },
               isSubscribed: {
                  // Does perticular channel is subscrbed by current user
                  $cond: {
                     if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                     then: true,
                     else: false
                  }
               }
            }

         },
         {
            // Selected thing to pass
            $project: {
               fullName: 1,
               userName: 1,
               subscriberCount: 1,
               channelSubscribedCount: 1,
               isSubscribed: 1,
               avatar: 1,
               coverImage: 1,
               email: 1

            }
         }
      ])

   if (!channel?.length) {
      throw new ApiError(404, "channel doesn't exists")
   }

   return res
      .status(200)
      .json(
         new ApiResponse(200, channel[0], "User channel fetched succeffuly ")
      )

})

const getWatchHistory = asyncHandler(async(req, res) => {

   //In  this pipeline is basically first find in add _id in watchHistory and 
   //then sub Pipeline in which search in user that  _id match if it is then add in owner field and then
   //again subPipeline  which only project fullname , username and email and then $addField return owner first element 
   const user = await User.aggregate([
       {
           $match: {
            // convert into  mongoDB id because mongoDB is actually store ObjectId('....') but req._id dive '......' 
            //(monoose interrnally all compare but not in pipeline) so this is to convert
               _id: new mongoose.Types.ObjectId(req.user._id) 
           }
       },
       {
           $lookup: {
               from: "videos",
               localField: "watchHistory",
               foreignField: "_id",
               as: "watchHistory",
               pipeline: [
                   {
                       $lookup: {
                           from: "users",
                           localField: "owner",
                           foreignField: "_id",
                           as: "owner",
                           pipeline: [
                               {
                                   $project: {
                                       fullName: 1,
                                       username: 1,
                                       avatar: 1
                                   }
                               }
                           ]
                       }
                   },
                   {
                       $addFields:{
                           owner:{
                               $first: "$owner"
                           }
                       }
                   }
               ]
           }
       }
   ])

   return res
   .status(200)
   .json(
       new ApiResponse(
           200,
           user[0].watchHistory,
           "Watch history fetched successfully"
       )
   )
})



export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}