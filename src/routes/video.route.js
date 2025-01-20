import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/userauth.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js"

const router = Router();

// router.route("/publish-video").post(jwtVerify, upload.fields([
//     {
//         name: "videoFile",
//         maxCount: 1
//     },
//     {
//         name: "thumbnail",
//         maxCount: 1
//     }
// ]),
//     publishAVideo
// )
// router.route("/get-video/:videoId")
// .get(jwtVerify,getVideoById);
// router.route("/toggle-status/:videoId")
// .post(jwtVerify,togglePublishStatus);
// router.route("/delete-video/:videoId")
// .post(jwtVerify,deleteVideo);
// router.route("/update-video/:videoId")
// .patch(jwtVerify,updateVideo);
// router.route("/get-allVideos")
// .get(jwtVerify,getAllVideos);

router.use(jwtVerify)

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
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
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;