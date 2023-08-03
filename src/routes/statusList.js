import express from 'express';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import statusController from '#root/controller/statusList';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(checkPermission({ listType: 'shareList' }), statusController.getMany);
router.route('/search').get(checkPermission({ listType: 'shareList' }), statusController.search);

export default router;
