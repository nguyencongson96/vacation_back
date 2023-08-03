import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';

function checkFriend() {
  return asyncWrapper(async (req, res, next) => {
    const userLoginId = req.userInfo._id;
    const shareStatus = req.body?.shareStatus;
    const memberList = req.body.memberList;
    const shareList = req.body.shareList;

    if (memberList || shareList) {
      //Get FriendList
      const friendList = await Friends.aggregate(
        [].concat(
          {
            $match: {
              $or: [
                { userId1: userLoginId, status: 'accepted' },
                { userId2: userLoginId, status: 'accepted' },
              ],
            },
          },
          {
            $project: {
              userId: { $cond: { if: { $eq: ['$userId1', userLoginId] }, then: '$userId2', else: '$userId1' } },
            },
          }
        )
      );

      //Throw an error if one of user in memberList is not user's friend
      if (memberList)
        for (const userId of memberList) {
          friendList.every(friend => friend.userId.toString() !== userId.toString()) &&
            _throw({ code: 400, message: 'all user in your memberList must be your friend' });
        }

      //Throw an error if one of user in shareList is not user's friend
      if (shareList && shareStatus === 'protect')
        for (const userId of shareList) {
          friendList.every(friend => friend.userId.toString() !== userId.toString()) &&
            _throw({ code: 400, message: 'all user in your shareList must be your friend' });
        }
    }

    next();
  });
}

export default checkFriend;
