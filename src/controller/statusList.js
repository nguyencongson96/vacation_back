import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import mongoose from 'mongoose';
import { getUserInfo, addTotalPageFields, facet, getResourcePath, checkFriend } from '#root/config/pipeline';

const statusController = {
  getMany: asyncWrapper(async (req, res) => {
    const { listType, type, id, page } = req.query;

    //Return status 204 when user wants to get shareList of shareStatus public or onlyme (these statuses did not have list attached)
    if (/(public|onlyme)/.test(req.doc.shareStatus) && listType === 'shareList') return res.sendStatus(204);

    const result = await mongoose.model(type).aggregate(
      [].concat(
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        { $unwind: `$${listType}` },

        //Get total, page and limit at most 10 elements pass to next stage
        addTotalPageFields({ page }),

        //Based on userId in listType, get avatar, username, firstname, lastname
        getUserInfo({
          localField: listType,
          field: ['avatar', 'username', 'firstname', 'lastname'],
          as: listType,
          isFriend: req.userInfo._id,
        }),

        checkFriend({ userId: req.userInfo._id, localField: '_id' }),

        //Destructure listType field
        {
          $project: {
            page: 1,
            pages: 1,
            total: 1,
            _id: `$${listType}._id`,
            firstname: `$${listType}.firstname`,
            lastname: `$${listType}.lastname`,
            username: `$${listType}.username`,
            avatar: `$${listType}.avatar`,
            isFriend: `$${listType}.isFriend`,
          },
        },

        //Restructure object and send to front
        facet({ meta: ['page', 'pages', 'total'], data: ['_id', 'firstname', 'lastname', 'username', 'avatar', 'isFriend'] })
      )
    );
    return res.json(result[0]);
  }),

  search: asyncWrapper(async (req, res) => {
    const { listType, type, page, id, value } = req.query;

    //Return status 204 when user wants to get shareList of shareStatus public or onlyme (these statuses did not have list attached) or get memberList of albums (albums did not have memberList)
    if (
      (/(public|onlyme)/.test(req.doc.shareStatus) && listType === 'shareList') ||
      (listType === 'memberList' && type === 'albums')
    )
      return res.sendStatus(204);

    const result = await mongoose.model(type).aggregate(
      [].concat(
        //Find the matched type by searching for id
        { $match: { _id: new mongoose.Types.ObjectId(id) } },

        //Based on userId in listType, get avatar, username, firstname, lastname
        getUserInfo({ localField: listType, field: ['username', 'firstname', 'lastname'], as: listType }),

        //Destructure listType field
        {
          $project: {
            _id: `$${listType}._id`,
            firstname: `$${listType}.firstname`,
            lastname: `$${listType}.lastname`,
            username: `$${listType}.username`,
          },
        },

        //Find the username contain value in query
        {
          $match: {
            $or: [
              { username: { $regex: value, $options: 'i' } },
              { firstname: { $regex: value, $options: 'i' } },
              { lastname: { $regex: value, $options: 'i' } },
            ],
          },
        },

        //Get total, page and limit at most 10 elements pass to next stage
        addTotalPageFields({ page }),

        //Check whether isFriend of user login or not
        checkFriend({ userId: req.userInfo._id, localField: '_id' }),

        //Get avatar of each user
        getResourcePath({ localField: '_id', as: 'avatar' }),

        //Restructure object to send to front
        facet({ meta: ['page', 'pages', 'total'], data: ['firstname', 'lastname', 'username', 'avatar', 'isFriend'] })
      )
    );
    return res.json(result[0]);
  }),
};

export default statusController;
