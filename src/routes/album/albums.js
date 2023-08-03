import express from 'express';
import albumsController from '#root/controller/album/albums';
import verifyJWT from '#root/middleware/verifyJWT';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkFriend from '#root/middleware/checkForbidden/checkFriend';

const router = express.Router();
router.use(verifyJWT);

router
  .route('/')
  .post(checkPermission({ modelType: 'vacations', listType: 'memberList' }), checkFriend(), albumsController.addNew)
  .get(albumsController.getList);

router
  .route('/:id')
  .get(checkPermission({ modelType: 'albums', listType: 'shareList' }), albumsController.getDetail)
  .put(checkAuthor({ modelType: 'albums' }), checkFriend(), albumsController.update)
  .delete(checkAuthor({ modelType: 'albums' }), albumsController.delete);

export default router;
