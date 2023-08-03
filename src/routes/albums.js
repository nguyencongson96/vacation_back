import express from 'express';
import albumsController from '#root/controller/albums';
import verifyJWT from '#root/middleware/verifyJWT';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(albumsController.getAlbumsUser).post(albumsController.addNew);
router
  .route('/:id')
  .get(checkPermission({ modelType: 'albums', listType: 'shareList' }), albumsController.getalbumdetail)
  .put(albumsController.updateAlbum)
  .delete(albumsController.deleteAlbum);

// router.get('/:id?', verifyJWT, albumsController.getAlbumsUser);
// router.post('/', verifyJWT, albumsController.addNew);
// router.put('/:id', verifyJWT, albumsController.updateAlbum);
// router.delete('/:id', verifyJWT, albumsController.deleteAlbum);

export default router;
