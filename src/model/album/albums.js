import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import Vacations from '#root/model/vacation/vacations';
import AlbumsPage from '#root/model/album/albumspage';

const albumSchema = new mongoose.Schema({
  vacationId: {
    type: mongoose.ObjectId,
    required: 'vacationId required',
    validate: async value => {
      const foundVacation = await Vacations.findById(value);
      !foundVacation &&
        _throw({
          code: 400,
          errors: [{ field: 'vacationId', message: 'invalid vacationId' }],
          message: 'invalid vacationId',
        });
    },
  },

  userId: {
    type: mongoose.ObjectId,
    required: 'UserId required',
    validate: async value => {
      const foundUser = await Users.findById(value);
      !foundUser &&
        _throw({
          code: 400,
          errors: [{ field: 'userId', message: 'invalid userId' }],
          message: 'invalid userId',
        });
    },
  },

  title: {
    type: String,
    trim: true,
    required: 'Title required',
    maxlength: 1000,
    validate: value => {
      !validator.isAlpha(value, 'vi-VN', { ignore: ' -_,()' }) &&
        _throw({
          code: 400,
          errors: [{ field: 'title', message: 'invalid title' }],
          message: 'invalid title',
        });
    },
  },

  shareStatus: {
    type: String,
    required: 'Share Status required',
    enum: ['public', 'protected', 'onlyme'],
    default: 'public',
  },

  shareList: [
    {
      type: mongoose.ObjectId,
      validate: async value => {
        const foundUser = await Users.findById(value);
        !foundUser &&
          _throw({
            code: 400,
            errors: [{ field: 'memberId', message: 'invalid userId' }],
            message: 'invalid userId',
          });
      },
    },
  ],

  createdAt: {
    type: Date,
  },

  lastUpdateAt: {
    type: Date,
    default: new Date(),
  },
});

//Config event after delete one album
albumSchema.post('findOneAndDelete', async function () {
  const { _id } = this.getQuery();

  //Use albumId to delete relevant Albumspage
  await AlbumsPage.findOneAndDelete({ albumId: _id });
});

const Albums = mongoose.model('albums', albumSchema);

export default Albums;
