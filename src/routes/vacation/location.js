import express from 'express';
import locationController from '#root/controller/vacation/location';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.route('/').get(locationController.getMany).post(verifyJWT, locationController.addNew);
router.get('/:id', verifyJWT, locationController.getOne);
export default router;
