import express from 'express';
import postController from '#root/controller/vacation/post';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';

const router = express.Router();

router.use(verifyJWT);

router.route('/').post(checkPermission({ modelType: 'vacations', listType: 'memberList' }), postController.addNew);

router
  .route('/vacation/:id')
  .get(checkPermission({ modelType: 'vacations', listType: 'shareList' }), postController.getManyByVacation);

router.route('/location/:id').get(postController.getManyByLocation);

router
  .route('/:id')
  .get(checkPermission({ modelType: 'posts', listType: 'shareList' }), postController.getOne)
  .put(checkAuthor({ modelType: 'posts' }), postController.update)
  .delete(checkAuthor({ modelType: 'posts' }), postController.delete);

export default router;
