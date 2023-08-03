import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import notiController from '#root/controller/interaction/notification';

const likeSchema = new mongoose.Schema(
  {
    modelType: {
      type: String,
      required: 'model Type required',
      enum: ['vacations', 'posts', 'albums'],
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

    lastUpdateAt: {
      type: Date,
      default: new Date(),
    },
  }
  // {
  //   versionKey: false,
  //   toObject: { getters: true, setters: true },
  //   toJSON: { getters: true, setters: true },
  //   runSettersOnQuery: true,
  // }
);

likeSchema.post('save', async function () {
  //Update new Notification to user has receive like action
  await notiController.updateContent({ document: this, action: 'like' });
});

const Likes = mongoose.model('likes', likeSchema);

export default Likes;
