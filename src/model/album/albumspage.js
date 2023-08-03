import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import _throw from '#root/utils/_throw';
import Albums from '#root/model/album/albums';
import Resources from '#root/model/resource/resource';

const albumspageSchema = new mongoose.Schema({
  albumId: {
    type: mongoose.ObjectId,
    required: 'albumId required',
    validate: async value => {
      const foundalbumspage = await Albums.findById(value);
      !foundalbumspage &&
        _throw({
          code: 400,
          errors: [{ field: 'albumId', message: 'invalid albumId' }],
          message: 'invalid albumsID',
        });
    },
  },

  resource: [
    {
      resourceId: {
        type: mongoose.ObjectId,
        required: 'resourceId required',
        trim: true,
        validate: async value => {
          const foundimage = await Resources.findById(value);
          !foundimage &&
            _throw({
              code: 400,
              errors: [{ field: 'resourceId', message: 'invalid resourceId' }],
              message: 'invalid resourceId',
            });
        },
      },

      style: {
        type: Schema.Types.Mixed,
        required: true,
        trim: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: new Date(),
  },

  lastUpdate: {
    type: Date,
    default: new Date(),
  },
});

const AlbumsPage = mongoose.model('AlbumsPage', albumspageSchema);

export default AlbumsPage;
