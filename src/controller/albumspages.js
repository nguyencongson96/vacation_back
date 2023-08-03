import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
// import AlbumsPage from '#root/model/albumspage';
// import Albums from '#root/model/albums';
import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';
import mongoose from 'mongoose';
import { addTotalPageFields, facet, getResourcePath, getUserInfo } from '#root/config/pipeline';
import Resources from '#root/model/resource/resource';

const albumspagesController = {
  newalbums: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const userId = req.userInfo._id;
    const { albumId, resource, vacationId, page } = req.body;
    if (!resource || resource.length === 0) {
      return res.status(400).json({ message: 'Please add pictures !' });
    }

    const existingAlbum = await AlbumsPage.findOne({
      albumId: albumId,
      userId: userId,
      vacationId: vacationId,
    });

    // if (existingAlbum) {
    //   // Người dùng đã tạo album trong vacation này rồi
    //   return res.status(400).json({ message: 'You can only create one album in this vacation' });
    // }

    const newAlbumPage = await AlbumsPage.create({
      albumId: albumId,
      userId: userId,
      page: page,
      resource: resource,
      createdAt: new Date(),
    });

    res.json({
      message: 'AlbumPage created successfully',
      data: newAlbumPage,
    });
  }),
  updatealbumspage: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const page = req.query.page;
    const albumPageId = req.params.albumpageId;

    const userId = req.userInfo._id;
    const { albumId, resource, vacationId } = req.body;

    if (!resource || resource.length === 0) {
      return res.status(400).json({ message: 'Please add pictures !' });
    }
    const existingAlbumPage = await AlbumsPage.findOne({
      _id: albumPageId,
    });

    if (!existingAlbumPage) {
      return res.status(404).json({ message: 'Album page not found' });
    }

    existingAlbumPage.albumId = albumId;
    existingAlbumPage.resource = resource;
    existingAlbumPage.vacationId = vacationId;
    existingAlbumPage.lastUpdate = new Date();

    const updatedAlbumPage = await existingAlbumPage.save();

    res.json({
      message: 'Album page updated successfully',
      data: updatedAlbumPage,
    });
  }),
  deletealbumspage: asyncWrapper(async (req, res) => {
    const albumPageId = req.params.id;
    const userId = req.userInfo._id;
    const albumPages = await AlbumsPage.findOne({ userId: userId });
    if (!albumPages) {
      return res.status(401).json({ message: 'Access denied' });
    }

    const existingAlbumPage = await AlbumsPage.findOneAndDelete({
      _id: albumPageId,
      userId: userId,
    });

    if (!existingAlbumPage) {
      return res.status(404).json({ message: 'Album page not found' });
    }

    res.json({
      message: 'Album page deleted successfully',
      data: existingAlbumPage,
    });
  }),

  getalbumspagesvacations: asyncWrapper(async (req, res) => {
    const { page } = req.query;
    // Lấy user ID từ request
    const userId = req.userInfo._id;
    const vacationId = new mongoose.Types.ObjectId(req.params.id);

    const albumspage = await Posts.aggregate(
      [].concat(
        { $match: { vacationId: vacationId } },
        getResourcePath({ localField: '_id', as: 'resources', returnAsArray: true }),
        {
          $group: {
            _id: null,
            resources: { $push: '$resources' },
          },
        },
        {
          $project: {
            _id: 0,
            resources: { $reduce: { input: '$resources', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
          },
        },
        { $unwind: '$resources' },
        addTotalPageFields({ page }),
        { $addFields: { _id: '$resources._id', path: '$resources.path' } },
        facet({ meta: ['page', 'pages', 'total'], data: ['_id', 'path'] })
      )
    );

    res.status(200).json(albumspage[0]);
  }),

  getmanyAlbumPage: asyncWrapper(async (req, res) => {
    const albumId = req.params.id;
    const page = req.query.page;
    const userId = req.userInfo._id;
    if (albumId && page) {
      const albums = await Albums.find({
        _id: albumId,
        $or: [{ userId: userId }, { shareList: userId }, { shareList: [] }],
      });

      if (!albums) {
        // Albums not found
        return res.status(404).json({ message: 'Albums not found' });
      }

      const albumPage = await AlbumsPage.aggregate(
        [].concat(
          { $match: { albumId: new mongoose.Types.ObjectId(albumId), page: Number(page) } },
          {
            $lookup: {
              from: 'resources',
              let: { resourceId: '$resource.resourceId' },
              pipeline: [{ $match: { $expr: { $in: ['$_id', '$$resourceId'] } } }, { $project: { path: 1 } }],
              as: 'resources',
            },
          },
          getUserInfo({ field: ['username'], as: 'userInfo' }),
          {
            $project: {
              albumId: 1,
              page: 1,
              userInfo: 1,
              resource: 1,
              resources: 1,
            },
          }
        )
      );

      let totalResources = 0;
      if (albumPage.length > 0) {
        albumPage.forEach(album => {
          album.resource.forEach(res => {
            const foundResource = album.resources.find(r => r._id.toString() === res.resourceId.toString());
            if (foundResource) {
              res.path = foundResource.path;
              totalResources++;
            }
          });
        });
      } else {
        return res.status(404).json({ message: 'albumPages not found' });
      }
      const albumPages = albumPage[0];

      const data = {
        _id: albumPages._id,
        albumId: albumPages.albumId,
        userInfo: albumPages.userInfo,
        resource: albumPages.resource,
      };

      res.json({
        message: 'Album details retrieved successfully',
        meta: {
          page: page,
          totalResources: totalResources,
        },
        data: data,
      });
    } else if (albumId) {
      const albums = await Albums.find({ _id: albumId, $or: [{ userId: userId }, { shareList: userId }] });

      if (!albums) {
        // Albums not found
        return res.status(404).json({ message: 'Albums not found' });
      }
      // const albumsId = albums._id;

      const albumPage = await AlbumsPage.aggregate(
        [].concat(
          { $match: { albumId: new mongoose.Types.ObjectId(albumId) } },
          {
            $lookup: {
              from: 'resources',
              let: { resourceId: '$resource.resourceId' },
              pipeline: [{ $match: { $expr: { $in: ['$_id', '$$resourceId'] } } }, { $project: { path: 1 } }],
              as: 'resources',
            },
          },
          getUserInfo({ field: ['username'], as: 'userInfo' }),
          {
            $project: {
              _id: 1,
              albumId: 1,
              page: 1,
              userInfo: 1,
              resource: 1,
              resources: 1,
            },
          }
        )
      );
      let totalResources = 0;
      if (albumPage.length > 0) {
        albumPage.forEach(album => {
          album.resource.forEach(res => {
            const foundResource = album.resources.find(r => r._id.toString() === res.resourceId.toString());
            if (foundResource) {
              res.path = foundResource.path;
              totalResources++;
            }
          });
        });
      }

      const albumPages = albumPage.map(album => ({
        _id: album._id,
        albumId: album.albumId,
        page: album.page,
        userInfo: album.userInfo,
        resource: album.resource,
      }));

      if (!albumPage) {
        return res.status(404).json({ message: 'albumPages not found' });
      }

      res.json({
        message: 'Album details retrieved successfully',
        meta: {
          page: page,
          totalResources: totalResources,
        },
        data: albumPages,
      });
    }
  }),
};

export default albumspagesController;
