import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';

const locationSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: 'districtId required',
      min: 1,
      max: 4,
    },

    title: {
      type: String,
      required: 'title required',
      maxlength: 1000,
      trim: true,
    },

    parentId: {
      type: mongoose.ObjectId,
      default: null,
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

    description: {
      type: String,
      trim: true,
      maxlength: 65000,
    },

    createdAt: {
      type: Date,
      default: new Date(),
    },
  },
  {
    versionKey: false,
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true },
    runSettersOnQuery: true,
  }
);

const Locations = mongoose.model('locations', locationSchema);

export default Locations;
