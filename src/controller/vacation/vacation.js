import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Vacations from '#root/model/vacation/vacations';
import { addTotalPageFields, getUserInfo, getCountInfo, facet, checkFriend, getResourcePath } from '#root/config/pipeline';
import mongoose from 'mongoose';

const vacationController = {
  getMany: asyncWrapper(async (req, res) => {
    const { page } = req.query;
    const userId = new mongoose.Types.ObjectId(req.query.userId ? req.query.userId : req.userInfo._id);

    //Set type default value is newFeed
    const type = /(newFeed|userProfile)/.test(req.query.type) ? req.query.type : 'newFeed';
    const isMyNewFeed = !req.query.userId && type === 'newFeed';

    const result = await Vacations.aggregate(
      [].concat(
        // Filter only return vacation has shareStatus is public or vacation has shareStatus is protected and has shared to user
        {
          $match: {
            $or: [
              isMyNewFeed ? { shareStatus: 'public' } : { shareStatus: 'public', memberList: { $in: [userId] } },
              { shareStatus: 'protected', shareList: { $in: [userId] } },
              { shareStatus: 'onlyme', userId: userId },
            ],
          },
        },

        //Check isFriend to sort
        checkFriend({ userId }),

        //Sort in order to push the newest updated vacation to top
        { $sort: Object.assign(isMyNewFeed ? { isFriend: -1 } : {}, { lastUpdateAt: -1, createdAt: -1 }) },

        //Add field total, page and pages fields
        addTotalPageFields({ page }),

        //Get total Likes and Comment by lookup to posts model
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'vacationId',
            pipeline: getCountInfo({ field: ['like', 'comment'] }),
            as: 'posts',
          },
        },

        //Get view Count
        getCountInfo({ field: ['view'] }),

        //Get cover photo of vacation
        getResourcePath({ localField: '_id', as: 'cover' }),

        //Get username of author by lookup to users model by userId
        getUserInfo({ field: ['username', 'avatar'] }),

        //Replace field post with total posts, add new field likes and comments with value is total
        {
          $addFields: {
            likes: { $sum: '$posts.likes' },
            comments: { $sum: '$posts.comments' },
            posts: { $size: '$posts' },
            'authorInfo.isFriend': '$isFriend',
          },
        },

        //Set up new array with total field is length of array and list field is array without __v field
        facet({
          meta: ['total', 'page', 'pages'],
          data: [
            'authorInfo',
            'title',
            'cover',
            'shareStatus',
            'posts',
            'views',
            'likes',
            'comments',
            'startingTime',
            'endingTime',
            'lastUpdateAt',
            'isFriend',
          ],
        })
      )
    );

    return res.status(200).json(result[0]);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const result = await Vacations.aggregate(
      [].concat(
        //Filter based on id
        { $match: { _id: new mongoose.Types.ObjectId(id) } },

        //Get userInfo by looking up to model
        getUserInfo({ field: ['username', 'avatar', 'firstname', 'lastname'], countFriend: true }),
        getResourcePath({ localField: '_id', as: 'cover' }),

        { $addFields: { isMember: { $in: [req.userInfo._id, '$memberList'] } } },

        //Get field count total views of vacation
        getCountInfo({ field: ['view', 'memberList'] })
      )
    );

    //Send to front
    return res.status(200).json({ data: result[0], message: 'get detail successfully' });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { title, description, memberList, shareStatus, shareList, startingTime, endingTime } = req.body;
    //Get userId from verifyJWT middleware
    const userId = req.userInfo._id.toString();

    //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
    const newMemberList = Array.isArray(memberList) ? [...new Set(memberList.concat(userId))] : [userId];

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    const newShareList =
      shareStatus === 'protected'
        ? Array.isArray(shareList)
          ? [...new Set(newMemberList.concat(shareList))]
          : newMemberList
        : null;

    //Create new Vacation and run validation when creating
    const newVacation = await Vacations.create({
      title,
      description,
      memberList: newMemberList,
      shareStatus,
      shareList: newShareList,
      startingTime,
      endingTime,
      userId,
      createdAt: new Date(),
      lastUpdateAt: new Date(),
    });

    //Send to front
    return res.status(201).json({ data: newVacation, message: 'vacation created' });
  }),

  update: asyncWrapper(async (req, res) => {
    //Get document from previous middleware
    const foundVacation = req.doc;

    //Save new info to foundVacation
    const { memberList, shareStatus, shareList } = req.body;

    // Update other fields
    const updateKeys = ['title', 'description', 'memberList', 'shareStatus', 'shareList', 'startingTime', 'endingTime'];
    let newMemberList = foundVacation.memberList;
    updateKeys.forEach(key => {
      switch (key) {
        case 'memberList':
          //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
          if (memberList) {
            newMemberList = Array.isArray(memberList)
              ? [...new Set(memberList.concat(req.userInfo._id.toString()))]
              : [req.userInfo._id];
            foundVacation.memberList = newMemberList;
          }
          break;

        case 'shareList':
          //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
          const newShareList =
            shareStatus === 'protected'
              ? [
                  ...new Set(
                    newMemberList.concat(
                      Array.isArray(shareList) ? shareList : foundVacation.shareList ? [] : foundVacation.shareList
                    )
                  ),
                ]
              : null;
          foundVacation.shareList = newShareList;
          break;

        case 'endingTime':
          //If endingTime < startingTime, then throw an error
          req.body.endingTime < req.body.startingTime &&
            _throw({
              code: 400,
              errors: [{ fields: 'endingTime', message: 'endingTime must be after startingTime' }],
              message: 'invalid endingTime',
            });
          break;

        default:
          req.body[key] && (foundVacation[key] = req.body[key]);
          break;
      }
    });

    //Save to databse
    foundVacation.lastUpdateAt = new Date();
    await foundVacation.save();

    //Send to front
    return res.status(201).json({ data: foundVacation, message: 'update successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const deleteVacation = await Vacations.findByIdAndDelete(id);

    //Send to front
    return res.status(200).json({ data: deleteVacation, message: 'delete successfully' });
  }),
};

export default vacationController;
