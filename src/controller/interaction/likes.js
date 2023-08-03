import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Likes from '#root/model/interaction/likes';
import mongoose from 'mongoose';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';

const likeController = {
  getMany: asyncWrapper(async (req, res) => {
    const { type, id, page } = req.query;

    const result = await Likes.aggregate(
      //Filter based on modelType and modelId
      [{ $match: { modelType: type, modelId: new mongoose.Types.ObjectId(id) } }].concat(
        //Add 3 fields, total, page, pages
        addTotalPageFields({ page }),

        //Look up to users model to get info
        getUserInfo({ field: ['username', 'avatar'], isFriend: req.userInfo._id }),

        //Restructure query
        facet({ meta: ['total', 'page', 'pages'], data: ['authorInfo'] })
      )
    );
    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),

  update: asyncWrapper(async (req, res, next) => {
    const { type, id } = req.query,
      userId = req.userInfo._id;

    //Find and delete like
    const foundLike = await Likes.findOneAndDelete({ modelType: type, modelId: id, userId: userId });

    if (foundLike)
      //Send to front
      return res.status(200).json({ data: foundLike, message: `user has unliked this ${type}` });
    //
    else {
      //Create new document
      const newLike = await Likes.create({ modelType: type, modelId: id, userId: userId, lastUpdateAt: new Date() });

      //Send to front
      return res.status(201).json({ data: newLike, message: `user has liked this ${type}` });
    }
  }),
};

export default likeController;
