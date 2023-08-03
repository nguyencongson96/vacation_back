import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import notiController from '#root/controller/interaction/notification';

const friendSchema = new mongoose.Schema({
  userId1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: 'UserId required',
  },
  userId2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: 'UserId required',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  lastUpdateAt: {
    type: Date,
    default: Date.now,
  },
});

friendSchema.post('save', async function () {
  await notiController.updateContent({
    document: { modelType: 'friends', modelId: this._id, receiverId: this.userId2, senderId: this.userId1 },
    action: 'addFriend',
  });
});

const Friends = mongoose.model('friends', friendSchema);

export default Friends;
