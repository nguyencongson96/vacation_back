import express from 'express';
import friendsController from '#root/controller/user/friend';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(friendsController.getFriendList);
router.get('/requestList', friendsController.getResquestList);
router
  .route('/:id')
  .post(friendsController.addFriend)
  .put(friendsController.acceptFriend)
  .delete(friendsController.removeFriend);

export default router;
