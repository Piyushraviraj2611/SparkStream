import { Router } from "express";
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from "../middleware/auth.middleware.js"

import {
    createTweet,
    getUserTweets,
    updateTweetContent,
    updateTweetFile,
    deleteTweet

} from "../controller/tweet.controller.js";
import multer from "multer";
const router = Router()

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
// all router.

router.route("/create-tweet").post(upload.single("file"),createTweet);
router.route("/user-tweets").get( getUserTweets);
router.route("/update-tweet-content/c/:tweetId").patch( updateTweetContent);
router.route("/update-tweet-file/c/:tweetId").patch(upload.single("file"), updateTweetFile);
router.route("/delete-tweet/c/:tweetId").delete(deleteTweet)

export default router  