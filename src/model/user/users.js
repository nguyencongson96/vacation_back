import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Locations from '#root/model/vacation/locations';

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      trim: true,
      required: 'Firstname required',
      maxlength: 100,
      validate: value => {
        !validator.isAlpha(value, 'vi-VN', { ignore: " -'" }) &&
          _throw({
            code: 400,
            errors: [{ field: 'firstname', message: 'Invalid firstname' }],
            message: 'Invalid firstname',
          });
      },
    },

    lastname: {
      type: String,
      trim: true,
      required: 'Lastname required',
      maxlength: 100,
      validate: value => {
        !validator.isAlpha(value, 'vi-VN', { ignore: " -'" }) &&
          _throw({
            code: 400,
            errors: [{ field: 'lastname', message: 'Invalid lastname' }],
            message: 'Invalid lastname',
          });
      },
    },

    username: {
      type: String,
      trim: true,
      required: 'Username required',
      minlength: 8,
      maxlength: 16,
      validate: value => {
        !validator.isAlphanumeric(value, 'vi-VN', { ignore: "-_'." }) &&
          _throw({
            code: 400,
            errors: [{ field: 'username', message: 'Invalid username' }],
            message: 'Invalid username',
          });
      },
    },

    email: {
      type: String,
      required: 'Email required',
      validate: value => {
        !validator.isEmail(value) &&
          _throw({
            code: 400,
            errors: [{ field: 'email', message: 'Invalid email' }],
            message: 'Invalid email',
          });
      },
    },

    dateOfBirth: {
      type: Date,
      max: new Date(),
      default: new Date(1),
    },

    gender: {
      type: String,
      required: 'Gender required',
      enum: ['Male', 'Female', 'Non-binary'],
      default: 'Male',
    },

    description: {
      type: String,
      maxlength: 65000,
      trim: true,
    },

    password: {
      type: String,
      minlength: 8,
      validate: value => {
        !validator.isStrongPassword(value, {
          minLength: 8,
          minLowercase: 1,
          minNumbers: 1,
          minUppercase: 1,
          minSymbols: 1,
        }) &&
          _throw({
            code: 400,
            errors: [{ field: 'password', message: 'password is weak' }],
            message: 'password is weak',
          });
      },
    },

    accessToken: {
      type: String,
    },

    refreshToken: {
      type: String,
    },

    verifyToken: {
      type: String,
    },

    passwordToken: {
      type: String,
    },

    createdAt: {
      type: Date,
    },

    lastActiveAt: {
      type: Date,
    },

    lastUpdateAt: {
      type: Date,
      default: new Date(),
    },

    nationality: {
      type: String,
      maxlength: 1000,
      validate: async value => {
        const locationList = (await Locations.find({ level: 4 })).map(item => item.title);
        !locationList.includes(value) &&
          _throw({ code: 400, errors: [{ field: 'nationality', message: 'invalid value' }], message: 'invalid value' });
      },
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },
  }
  // {
  //   versionKey: false,
  //   toObject: { getters: true, setters: true },
  //   toJSON: { getters: true, setters: true },
  //   runSettersOnQuery: true,
  // }
);

const Users = mongoose.model('users', userSchema);

export default Users;
