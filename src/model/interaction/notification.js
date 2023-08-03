import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';

const notiSchema = new mongoose.Schema(
  {
    modelType: {
      type: String,
      required: 'model Type required',
      enum: ['posts', 'vacations', 'albums', 'friends'],
      default: 'friend',
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

    userActionId: {
      type: mongoose.ObjectId,
      required: 'userActionId required',
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

    action: {
      type: String,
      required: 'action required',
      enum: ['like', 'comment', 'addFriend'],
    },

    isSeen: {
      type: Boolean,
      required: 'seen status required',
      default: false,
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
    // optimisticConcurrency: true,
    //   versionKey: '__v',
    //   toObject: { getters: true, setters: true },
    //   toJSON: { getters: true, setters: true },
    //   runSettersOnQuery: true,
  }
);

const Notifications = mongoose.model('notifications', notiSchema);

export default Notifications;
