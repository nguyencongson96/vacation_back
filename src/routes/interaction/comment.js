import express from 'express';
import commentController from '#root/controller/interaction/comments';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
const router = express.Router();

router.use(verifyJWT);
router
  .route('/')
  .get(checkPermission({ listType: 'shareList' }), commentController.getMany)
  .post(checkPermission({ listType: 'shareList' }), commentController.addNew);

router
  .route('/:id')
  .put(checkAuthor({ modelType: 'comments' }), commentController.update)
  .delete(checkAuthor({ modelType: 'comments' }), commentController.delete);
export default router;
