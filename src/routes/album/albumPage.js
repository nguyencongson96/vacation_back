import express from 'express';
import albumsController from '#root/controller/album/albums';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkFriend from '#root/middleware/checkForbidden/checkFriend';

const router = express.Router();
router.use(verifyJWT);

router.route('/:id').put(checkAuthor({ modelType: 'albums' }), albumsController.updateAlbumPage);

export default router;
