import dbConnect from '#root/config/dbConnect';
import mongoose from 'mongoose';

const asyncWrapper = fn => {
  return async (req, res, next) => {
    try {
      // await dbConnect();
      await fn(req, res, next);
      // await mongoose.disconnect();
    } catch (err) {
      next(err);
    }
  };
};

export default asyncWrapper;
