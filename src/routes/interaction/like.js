import express from 'express';
import likeController from '#root/controller/interaction/likes';
import verifyJWT from '#root/middleware/verifyJWT';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
const router = express.Router();

router.use(verifyJWT);
router
  .route('/')
  .get(likeController.getMany)
  .put(checkPermission({ listType: 'shareList' }), likeController.update);

export default router;
