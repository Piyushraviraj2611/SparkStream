import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    updateThumbnail,
} from "../controller/video.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"
import {upload} from "../middleware/multer.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "video",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)

    router.route("/video-update/:videoId").patch(upload.single("video"), updateVideo);
   router.route("/thumbnail-update/:videoId").patch(upload.single("thumbnail"),updateThumbnail)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router