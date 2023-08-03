import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import { searchOne, searchMany } from '#root/config/pipeline';

const searchController = {
  searchMany: asyncWrapper(async (req, res) => {
    const { value } = req.query;
    const result = await searchMany({ models: ['vacation', 'location', 'user', 'album'], value: value });

    return res.status(200).json({ data: result, message: 'search successfully' });
  }),

  searchOne: asyncWrapper(async (req, res) => {
    const { type } = req.params,
      { value, page } = req.query;
    const result = await searchOne({ model: type, value: value, page, userId: req.userInfo._id });

    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),
};

export default searchController;
