import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {jwtVerify} from "../middlewares/userauth.middleware.js"
import {isPlaylistOwner} from "../middlewares/isPlaylistOwner.js"

const router = Router();

router.use(jwtVerify); 

router.route("/").post(createPlaylist)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(isPlaylistOwner,updatePlaylist)
    .delete(isPlaylistOwner,deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(isPlaylistOwner,addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(isPlaylistOwner,removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router