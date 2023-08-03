import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Albums from '#root/model/album/albums';
import mongoose from 'mongoose';
import { addTotalPageFields, facet, getUserInfo, getResourcePath } from '#root/config/pipeline';
import AlbumsPage from '#root/model/album/albumspage';

const albumsController = {
  getList: asyncWrapper(async (req, res) => {
    const { userId, page } = req.query;
    const searchUserId = new mongoose.Types.ObjectId(userId ? userId : req.userInfo._id);

    const result = await Albums.aggregate(
      [].concat(
        {
          $match: Object.assign(
            { userId: searchUserId },
            userId
              ? {
                  $or: [
                    { shareStatus: 'public' },
                    { shareStatus: 'protected', shareList: { $in: [userId] } },
                    { shareStatus: 'onlyme', userId: new mongoose.Types.ObjectId(userId) },
                  ],
                }
              : {}
          ),
        },
        addTotalPageFields({ page }),
        {
          $lookup: {
            from: 'albumspages',
            localField: '_id',
            foreignField: 'albumId',
            as: 'cover',
          },
        },
        { $addFields: { cover: { $first: '$cover.resource' } } },
        { $addFields: { cover: { $first: '$cover' } } },
        { $addFields: { cover: '$cover.resourceId' } },
        {
          $lookup: { from: 'resources', localField: 'cover', foreignField: '_id', as: 'cover' },
        },
        { $addFields: { cover: { $first: '$cover.path' } } },
        // getUserInfo({ field: ['firstname', 'lastname', 'username', 'avatar'] }),
        // getResourcePath({ localField: '_id', as: 'cover' }),
        { $addFields: { shareList: { $cond: [{ $isArray: '$shareList' }, { $size: '$shareList' }, 0] } } },
        facet({
          meta: ['total', 'page', 'pages'],
          data: ['authorInfo', 'title', 'lastUpdateAt', 'image', 'shareStatus', 'shareList', 'cover'],
        })
      )
    );

    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),

  getDetail: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const albumId = new mongoose.Types.ObjectId(req.params.id);
    const result = await Albums.aggregate(
      [].concat(
        { $match: { _id: albumId } },
        getUserInfo({ field: ['username', 'firstname', 'lastname', 'avatar'] }),
        {
          $lookup: {
            from: 'albumspages',
            localField: '_id',
            foreignField: 'albumId',
            pipeline: [
              { $project: { resource: 1 } },
              { $unwind: '$resource' },
              { $lookup: { from: 'resources', localField: 'resource.resourceId', foreignField: '_id', as: 'path' } },
              { $project: { resourceId: '$resource.resourceId', style: '$resource.style', path: { $first: '$path.path' } } },
            ],
            as: 'images',
          },
        },
        { $addFields: { shareList: { $cond: [{ $isArray: '$shareList' }, { $size: '$shareList' }, 0] } } },
        { $project: { image: 0, 'images._id': 0 } }
      )
    );

    // Return the list of albums
    res.status(200).json({ message: 'get infor success', data: result[0] });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { vacationId, title, shareStatus, shareList } = req.body;
    //Get userId from verifyJWT middleware
    const userLoginId = req.userInfo._id;

    //Throw an error if user has created one album for this vacation before
    const foundAlbum = await Albums.findOne({ vacationId: vacationId, userId: userLoginId });
    foundAlbum && _throw({ code: 400, message: 'user has already create an album for this vacation' });

    // Create new album and run validation when creating
    const newAlbum = await Albums.create({
      vacationId,
      userId: userLoginId,
      title,
      shareStatus,
      shareList: shareStatus === 'protected' ? [...new Set(shareList.concat(userLoginId))] : null,
      createdAt: new Date(),
      lastUpdateAt: new Date(),
    });

    //Create new Album Page for new album created
    await AlbumsPage.create({
      albumId: newAlbum._id,
      createdAt: new Date(),
      lastUpdateAt: new Date(),
    });

    // Send response to the front-end
    return res.status(201).json({ data: newAlbum, message: 'Album created' });
  }),

  update: asyncWrapper(async (req, res) => {
    const { shareStatus } = req.body;
    const foundAlbum = req.doc;
    const userLoginId = req.userInfo._id;

    // update album info
    ['title', 'description', 'shareStatus', 'shareList', 'lastUpdateAt'].forEach(async item => {
      switch (item) {
        case 'lastUpdateAt':
          foundAlbum.lastUpdateAt = new Date();
          break;

        case 'shareList':
          const newShareList = req.body.shareList.concat(userLoginId.toString());
          foundAlbum.shareList = shareStatus === 'protected' ? [...new Set(newShareList)] : null;
          break;

        default:
          const value = req.body[item];
          if (value) foundAlbum[item] = value;
          break;
      }
    });

    // save to DB
    const updatedAlbum = await foundAlbum.save();

    return res.status(200).json({ data: updatedAlbum, message: 'Album updated' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Remove album from db
    const deletedAlbum = await Albums.findByIdAndDelete(id);

    //Send to front
    return res.status(200).json({
      message: 'Albums deleted',
      data: deletedAlbum,
    });
  }),

  updateAlbumPage: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { resource } = req.body;

    //Throw an error if resource length is zero or resource is not an array
    (!Array.isArray(resource) || resource.length === 0) && _throw({ code: 400, message: 'please add pictures' });

    //Throw an error if album page not found
    const foundAlbumPage = await AlbumsPage.findOneAndUpdate(
      { albumId: id },
      { resource: resource, lastUpdateAt: new Date() },
      { returnDocument: 'after', runValidators: true, fields: { resource: 1, _id: 0 } }
    );
    !foundAlbumPage && _throw({ code: 404, message: 'albumpage not found' });

    return res.status(200).json({
      message: 'Album page updated successfully',
      data: foundAlbumPage.resource,
    });
  }),
};
export default albumsController;
