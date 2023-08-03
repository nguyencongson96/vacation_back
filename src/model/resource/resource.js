import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import { getStorage, ref, deleteObject } from 'firebase/storage';

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'name required',
      maxlength: 100,
    },

    type: {
      type: String,
      trim: true,
      required: 'type required',
    },

    size: {
      type: Number,
      required: 'size required',
      min: 0,
      default: 0,
    },

    path: {
      type: String,
      trim: true,
      required: 'path required',
    },

    userId: {
      type: mongoose.ObjectId,
      required: 'UserId required',
      validate: async value => {
        const foundUser = await Users.findById(value);
        !foundUser && _throw({ code: 404, errors: [{ field: 'userId', message: 'userId not found' }] });
      },
    },

    ref: {
      type: [
        {
          model: {
            type: String,
            required: 'model ref required',
            trim: true,
            enum: ['users', 'vacations', 'posts', 'albums'],
          },
          _id: {
            type: mongoose.ObjectId,
            required: 'modelId required',
          },
          field: { type: String, trim: true },
          index: { type: Number, min: 0 },
        },
      ],
    },

    createdAt: {
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

resourceSchema.pre('findOneAndDelete', async function (next) {
  const foundResource = await this.model.findById(this.getQuery());
  if (foundResource) {
    const { path } = foundResource;

    // Create a reference to the file to delete
    const storage = getStorage();
    const desertRef = ref(storage, path);

    // Delete the file
    await deleteObject(desertRef);
    console.log('deleted file in firebase');
  }
  next();
});

resourceSchema.pre('deleteMany', async function (next) {
  const foundResources = await this.model.find(this.getFilter());

  // Create a reference to the file to delete
  const storage = getStorage();

  for (const document of foundResources) {
    const desertRef = ref(storage, document.path);
    // Delete the file
    await deleteObject(desertRef);
  }

  console.log(`deleted ${foundResources.length} files in firebase`);
  next();
});

const Resources = mongoose.model('resources', resourceSchema);

export default Resources;
