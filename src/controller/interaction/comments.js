import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Comments from '#root/model/interaction/comments';
import mongoose from 'mongoose';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';

const commentController = {
  getMany: asyncWrapper(async (req, res) => {
    const { type, id, page } = req.query;

    const result = await Comments.aggregate(
      [].concat(
        //Filter based on modelType and modelId
        { $match: { modelType: type, modelId: new mongoose.Types.ObjectId(id) } },

        //Add 3 fields, total, page, pages
        addTotalPageFields({ page }),

        //Look up to users model to get info
        getUserInfo({ field: ['username', 'avatar'] }),

        //Restructure query
        facet({ meta: ['total', 'page', 'pages'], data: ['authorInfo', 'content', 'lastUpdateAt'] })
      )
    );
    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),

  addNew: asyncWrapper(async (req, res, next) => {
    const { type, id } = req.query,
      { content } = req.body,
      userId = req.userInfo._id;

    //Create new comment
    const newComment = await Comments.create({
      modelType: type,
      modelId: id,
      userId,
      content,
      createdAt: new Date(),
      lastUpdateAt: new Date(),
    });

    //Send to front
    return res.status(201).json({ data: newComment, message: `add comment successfully` });
  }),

  update: asyncWrapper(async (req, res) => {
    const { content } = req.body;
    // userId = req.userInfo._id;

    //Get document from the previous middleware
    const foundComment = req.doc;

    //Save new content to DB
    foundComment.content = content;
    foundComment.lastUpdateAt = new Date();
    await foundComment.save();

    //Send to front
    return res.status(201).json({ data: foundComment, message: 'update comment successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Delete comment from DB
    const deleteComment = await Comments.findByIdAndDelete(id);

    //Send to front
    return res.status(200).json({ data: deleteComment, message: 'delete comment successfully' });
  }),
};

export default commentController;
