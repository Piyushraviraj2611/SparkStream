import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateAccountDetails,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controller/user.controller.js";
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router()

//Here Url https://localhost:8000/api/v1/users/register....
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyJWT, logoutUser)   // verify jwt middleware is bacially add user data from cookies to req.body
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/account-update").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:userName").get(verifyJWT, getUserChannelProfile)  // due to re.params
router.route("/history").get(verifyJWT, getWatchHistory)





export default router 