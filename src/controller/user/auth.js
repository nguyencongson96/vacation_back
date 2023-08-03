import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Users from '#root/model/user/users';
import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import sendMail from '#root/utils/email/sendEmail';
import path from 'path';
import validator from 'validator';
import { publicPath } from '#root/config/path';

const usersController = {
  logIn: asyncWrapper(async (req, res) => {
    const { username, email, password } = req.body;

    if (username || email) {
      const value = username ? { username } : { email };

      //Get User from database
      const foundUser = await Users.findOne(value);
      !foundUser && _throw({ code: 404, message: 'user not found' });

      !foundUser.emailVerified && _throw({ code: 401, message: 'account has not been verified by email yet' });

      // Evaluate password
      const match = await bcrypt.compare(password, foundUser.password);
      !match && _throw({ code: 400, message: 'password not match' });

      //Generate new accessToken
      const accessToken = jwt.sign({ username: foundUser.username }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      });

      //Generate new refreshToken
      const refreshToken = jwt.sign({ username: foundUser.username }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
      });

      //Save token to database to prevent previousToken still take effect
      foundUser.accessToken = accessToken;
      foundUser.refreshToken = refreshToken;
      foundUser.createdAt = new Date();
      await foundUser.save();

      //Get Avatar for user login
      const avatar = await mongoose
        .model('resources')
        .findOne(
          { ref: { $elemMatch: { model: 'users', _id: foundUser._id, field: 'avatar' } } },
          { path: 1, createdAt: 1 }
        );

      //Return result
      return res.status(200).json({
        data: {
          _id: foundUser._id,
          username: foundUser.username,
          firstname: foundUser.firstname,
          lastname: foundUser.lastname,
          avatar,
          accessToken,
          refreshToken,
        },
        message: 'login successfully',
      });
    } else _throw({ code: 400, message: 'no username or email' });
  }),

  logOut: asyncWrapper(async (req, res) => {
    //Get user from database
    const foundUser = await Users.findOneAndUpdate(
      { username: req.username },
      //Reset all token
      { accessToken: '', refreshToken: '', lastActiveAt: new Date() },
      //Run validator
      { runValidators: true }
    ).lean();

    //Send to front
    return foundUser
      ? res.status(200).json({ message: 'log out successfully' })
      : _throw({ code: 403, message: 'Invalid refreshToken' });
  }),

  register: asyncWrapper(async (req, res) => {
    //Get username and password from req.body
    const { email, username, password } = req.body;

    //Check for duplicate username in database
    const duplicate = await Users.findOne({ $or: [{ username }, { email }] }).lean();
    duplicate && _throw({ code: 400, message: 'username or email has already been existed' });

    //Create new user and validate infor
    const newUser = new Users(req.body);
    await newUser.validate();

    //Save hashedPwd
    const hashedPwd = await bcrypt.hash(password, 10);
    newUser.password = hashedPwd;

    //Get new passwordToken and save to foundUser
    const verifyToken = new mongoose.Types.ObjectId();
    newUser.verifyToken = verifyToken;

    //Save to database
    newUser.createdAt = new Date();
    await newUser.save();

    //Send email
    await sendMail({
      type: 'verify',
      email,
      url: `${process.env.URL}/auth/verify?email=${email}&token=${verifyToken}`,
    });

    //Send to front
    return res.status(200).json({ message: `an email has been send to ${email} account. Please check your email account` });
  }),

  verify: asyncWrapper(async (req, res) => {
    //Get username and password from req.body
    const { email, token } = req.query;

    const foundUser = await Users.findOne({ email, verifyToken: token });
    if (foundUser) {
      //Save token to database to prevent previousToken still take effect
      foundUser.emailVerified = true;
      foundUser.lastUpdateAt = new Date();
      await foundUser.save();

      //Send result to frontend
      return res.sendFile(path.join(publicPath, 'verify', 'success.html'));
    } else return res.sendFile(path.join(publicPath, 'verify', 'fail.html'));
  }),

  update: asyncWrapper(async (req, res) => {
    //Find User by username get from accessToken
    const foundUser = req.userInfo;

    //Get schema User and Update User
    const templateUser = await Users.schema.obj;
    for (const key of Object.keys(templateUser)) {
      const val = req.body[key];
      //Only processing update if has any value
      if (val) {
        switch (key) {
          case 'username':
            if (foundUser.username !== val) {
              //Check username is already existed or not
              const checkDup = await Users.findOne({ username: val });
              checkDup && _throw({ code: 400, message: 'username has already existed' });
              foundUser.username = val;
            }
            break;

          case 'password':
            !validator.isStrongPassword(val, {
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

            //Hash the new password
            const newPassword = await bcrypt.hash(val, 10);
            foundUser.password = newPassword;
            break;

          case 'lastUpdateAt':
            foundUser.lastUpdateAt = new Date();
            break;

          case 'lastActiveAt':
            foundUser.lastActiveAt = new Date();
            break;

          case 'email':
            //Do not update email
            break;

          default:
            //update any value that match key
            foundUser[key] = val;
            break;
        }
      }
    }

    //Save new Infor
    await foundUser.save();

    //Send to front
    const result = Object.keys(foundUser._doc).reduce(
      (obj, key) =>
        /(passwordToken|refreshToken|accessToken|password|emailVerified)/i.test(key)
          ? obj
          : Object.assign(obj, { [key]: foundUser._doc[key] }),
      {}
    );

    return res.status(200).json({
      data: { userInfo: result },
      message: `user ${foundUser.username} update successfully`,
    });
  }),

  forgot: asyncWrapper(async (req, res) => {
    //Get email from req.query
    const { email } = req.params;

    //Found user based on email
    const foundUser = await Users.findOne({ email });

    //Throw an error if cannot find matched user
    !foundUser &&
      _throw({
        code: 400,
        errors: { field: 'email', message: 'email is not register in server' },
        message: 'email is not register in server',
      });

    //Get new passwordToken and save to foundUser
    const passwordToken = new mongoose.Types.ObjectId();
    foundUser.passwordToken = passwordToken;

    //Send passwordToken to email got from req.query
    await sendMail({ type: 'reset', email, token: passwordToken });

    //Save new info of foundUser to database
    await foundUser.save();

    //Send to front
    return res.status(200).json({ data: '', message: 'send reset password email successfully' });
  }),

  reset: asyncWrapper(async (req, res) => {
    //Get new Password and secretToken from req.body
    const { password, passwordToken } = req.body;

    //Find user based on secretToken
    const foundUser = await Users.findOne({ passwordToken });

    //Throw an error if cannot find user
    !foundUser &&
      _throw({
        code: 400,
        errors: { field: 'passwordToken', message: 'invalid passwordToken' },
        message: 'invalid passwordToken',
      });

    // Get new hash password and save it to database
    const hashNewPwd = await bcrypt.hash(password, 10);
    foundUser.password = hashNewPwd;
    await foundUser.save();

    // Send to front
    return res.status(200).json({ data: '', message: 'user reset password successfully' });
  }),

  refresh: asyncWrapper(async (req, res) => {
    //Get token from headers.authorization
    const authHeader = req.headers.authorization || req.headers.Authorization;

    //Log token
    console.log(authHeader);

    // If the authorization header doesn't start with "Bearer ", throw an error
    !authHeader && _throw({ code: 401, message: 'auth header not found' });

    //In case token startWith Bearer
    if (authHeader?.startsWith('Bearer ')) {
      //Get token without "Bearer"
      const refreshToken = authHeader.split(' ')[1];

      //verify Token
      await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async err => {
        err &&
          _throw({
            code: 403,
            errrors: [{ field: 'refreshToken', message: 'invalid' }],
            message: 'invalid token',
          });
      });

      //Find User have refreshToken in database
      const foundUser = await Users.findOne({ refreshToken });
      !foundUser && _throw({ code: 400, message: 'invalid token' });

      //Create new accessToken
      const accessToken = jwt.sign({ username: foundUser.username }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      });

      //Save new accessToken to db
      foundUser.accessToken = accessToken;
      await foundUser.save();

      //Send new accessToken to front
      return res.status(200).json({
        data: { accessToken },
        message: 'refresh successfully',
      });
    }
    //Throw an error if token do not start with "Bearer"
    else
      _throw({
        code: 403,
        errrors: [{ field: 'refreshToken', message: 'invalid' }],
        message: 'invalid token',
      });
  }),

  delete: async (req, res) => {
    //Config expired date
    const expDate = new Date(Date.now() - process.env.MAX_RANGE_ACTIVE_ACCOUNT);

    //Delete all users has not verified by their email in 30 days
    const deleteInactiveUser = await Users.deleteMany({ emailVerified: false, lastUpdateAt: { $lte: expDate } });

    //return result
    return deleteInactiveUser;
  },
};

export default usersController;
