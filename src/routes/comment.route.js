import { Router } from "express";
import { jwtVerify } from "../middlewares/userauth.middleware.js";
import {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
} from "../controllers/comment.controller.js"

const router = Router();

// router.route("/add-comment/:videoId").post(jwtVerify,addComment);
// router.route("/update-comment/:commentId").patch(jwtVerify,updateComment);
// router.route("/delete-comment/:commentId").post(jwtVerify,deleteComment);
// router.route("/get-comments/:videoId").get(getVideoComments)

router.use(jwtVerify);

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;