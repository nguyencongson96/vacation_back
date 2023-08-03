import jwt from 'jsonwebtoken';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
// import dbConnect from '#root/config/dbConnect';

const verifyJWT = asyncWrapper(async (req, res, next) => {
  // Get the authorization header from the request
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // console.log(authHeader); // Log the authorization header to the console

  // If the authorization header doesn't start with "Bearer ", throw an error
  !authHeader && _throw({ code: 401, message: 'auth header not found' });
  //Throw an error if token do not start with "Bearer"
  !authHeader.startsWith('Bearer ') &&
    _throw({
      code: 403,
      errrors: [{ field: 'accessToken', message: 'invalid' }],
      message: 'invalid token',
    });

  const accessToken = authHeader.split(' ')[1];

  // Verify the access token using the secret key
  await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    err && _throw({ code: 403, message: 'invalid token' });
    req.username = decoded.username;
  });

  // Find the token in the database, if the token is not found in the database, return a 403 Forbidden status code
  const foundUser = await Users.findOne({ accessToken });
  !foundUser &&
    _throw({
      code: 403,
      errrors: [{ field: 'accessToken', message: 'outdated' }],
      message: 'outdated token',
    });
  req.userInfo = foundUser;

  // Call the next middleware function
  next();
});

export default verifyJWT;
