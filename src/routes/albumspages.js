import express from 'express';
import verifyJWT from '#root/middleware/verifyJWT';
import albumspagesController from '#root/controller/albumspages';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';

const router = express.Router();

router.post(
  '/',
  verifyJWT,
  checkPermission({ modelType: 'vacations', listType: 'memberList' }),

  albumspagesController.newalbums
);

router.put(
  '/:albumpageId',
  verifyJWT,
  checkPermission({ modelType: 'vacations', listType: 'memberList' }),
  albumspagesController.updatealbumspage
);
router.delete('/:id', verifyJWT, albumspagesController.deletealbumspage);

router.get('/:id', verifyJWT, albumspagesController.getmanyAlbumPage);

export default router;
