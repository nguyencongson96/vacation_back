import express from 'express';
import authController from '#root/controller/user/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import usersController from '#root/controller/user/userinfo';

const router = express.Router();

router
  .post('/login', authController.logIn)
  .post('/register', authController.register)
  .post('/verify', authController.verify)
  .post('/refresh', authController.refresh)
  .post('/forgot/:email', authController.forgot)
  .put('/reset', authController.reset);

router.use(verifyJWT);
router
  .put('/update', authController.update)
  .get('/info/:id?', usersController.getprofile)
  .post('/logout', authController.logOut);

export default router;
