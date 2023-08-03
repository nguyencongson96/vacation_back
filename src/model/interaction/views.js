import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';

const viewSchema = new mongoose.Schema(
  {
    modelType: {
      type: String,
      required: 'model Type required',
      enum: ['vacations', 'albums'],
      default: 'vacations',
    },

    modelId: {
      type: mongoose.ObjectId,
      required: 'modelId required',
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

    quantity: {
      type: Number,
      required: 'quantity required',
      min: 1,
      default: 1,
    },

    createdAt: {
      type: Date,
    },

    lastUpdateAt: {
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

const Views = mongoose.model('views', viewSchema);

export default Views;
