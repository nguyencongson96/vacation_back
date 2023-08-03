import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';

const updatePost = async (req, res) => {
  // const result = await mongoose.model('vacations').findByIdAndDelete('64bd220c408ec132e3a67a76');
  // return res.json(result);
  // console.log(new Date());
};

router.get('/', updatePost);

export default router;
