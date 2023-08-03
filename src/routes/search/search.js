import express from 'express';
import searchController from '#root/controller/search/search';
import verifyJWT from '#root/middleware/verifyJWT';
const router = express.Router();

router.use(verifyJWT);
router.route('/').get(searchController.searchMany);
router.route('/:type').get(searchController.searchOne);

export default router;
