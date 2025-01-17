import { Router } from  "express"
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccount,
    updateAvatar, updateCoverImg, getUserChannelDetails, getUserWatchHistory } from "../controllers/user.controller.js"
import upload from "../middlewares/multer.middleware.js"
import {jwtVerify} from "../middlewares/userauth.middleware.js"

const router = Router()

router.route("/register")
.post(
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
);

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").get(
    jwtVerify,
    logoutUser
)
router.route("/refresh-token").get(
    refreshAccessToken
)
router.route("/change-password").post(jwtVerify,changeCurrentPassword)
router.route("/current-user").get(jwtVerify,getCurrentUser)
router.route("/update-account").patch(jwtVerify,updateAccount)
router.route("/update-avatar")
.patch(jwtVerify,
    upload.single("avatar")
    ,updateAvatar
)
router.route("/update-coverImg")
.patch(jwtVerify,
    upload.single("coverImg"),
    updateCoverImg
)
router.route("/user-channel/:username").get(jwtVerify,getUserChannelDetails)
router.route("/watch-history").get(jwtVerify,getUserWatchHistory);

export default router;