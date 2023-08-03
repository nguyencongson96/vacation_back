import express from 'express';
import notiController from '#root/controller/interaction/notification';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';

const router = express.Router();

router.use(verifyJWT);
router.get('/', notiController.getMany);
router.put('/all', notiController.updateStatusAll);
router.put('/one/:id', checkAuthor({ modelType: 'notifications' }), notiController.updateStatusOne);

export default router;
