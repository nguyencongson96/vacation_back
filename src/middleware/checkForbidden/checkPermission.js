import Vacations from '#root/model/vacation/vacations';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Posts from '#root/model/vacation/posts';
import mongoose from 'mongoose';

function checkPermission({ field, modelType, listType }) {
  return asyncWrapper(async (req, res, next) => {
    const userIdLogin = req.userInfo._id;
    const id = req.params?.id || req.query?.id || req.body?.id || req.query?.vacationId || req.body?.vacationId;

    //Config listType
    if (!listType) listType = req.query.listType;

    //Config field
    if (!field) field = req.params?.field || req.query?.field || req.body?.field;

    //Config model to findById
    !modelType &&
      (modelType = field
        ? /(vcover|post)/.test(field)
          ? 'vacations'
          : /(acover)/.test(field)
          ? 'albums'
          : 'users'
        : req.query?.type || req.params?.type || req.body?.type);

    if (/(vacations|albums|posts)/.test(modelType)) {
      //Find document based on params id
      let foundDocument;
      switch (modelType) {
        case 'posts':
          //Throw an error if cannot find post
          const foundPost = await Posts.findById(id);
          !foundPost && _throw({ code: 404, errors: [{ field: 'id', message: 'invalid' }], message: 'post not found' });

          //Find vacation based on vacationId in foundPost
          foundDocument = await Vacations.findById(foundPost.vacationId);
          break;

        default:
          foundDocument = await mongoose.model(modelType).findById(id);
          break;
      }

      //Throw an error if cannot find Type
      !foundDocument &&
        _throw({ code: 404, errors: [{ field: 'id', message: 'invalid' }], message: `${modelType} not found` });

      //If check permission in shareList
      if (listType === 'shareList') {
        const { shareList, shareStatus, userId } = foundDocument;
        switch (shareStatus) {
          case 'onlyme':
            //Throw an error if userId login is not author of this modelType
            userIdLogin.toString() !== userId.toString() &&
              _throw({
                code: 403,
                errors: [{ field: 'shareList', message: `user have no permission to access this ${modelType}` }],
                message: 'Forbidden',
              });
            break;

          case 'protected':
            //Throw an error if userId login is not in shareList of this modelType
            !shareList.includes(userIdLogin) &&
              _throw({
                code: 403,
                errors: [{ field: 'shareList', message: `user is not in shareList of this ${modelType}` }],
                message: 'Forbidden',
              });
            break;

          default:
            break;
        }
      }

      //If check permission in memberList
      else if (listType === 'memberList') {
        const { memberList, userId } = foundDocument;
        //Throw an error if user login is not in memberList of vacation
        !memberList.includes(userIdLogin) &&
          userId.toString() !== userIdLogin.toString() &&
          _throw({
            code: 403,
            errors: [{ field: 'memberList', message: `user is not in memberList of this ${modelType}` }],
            message: 'Forbidden',
          });
      }

      //Throw an error if listType params is not memberList nor shareList
      else _throw({ code: 500, message: 'Invalid listType' });

      //Send result to next middleware
      req.doc = foundDocument;
    }

    //Throw an error if modelType is other value than user
    else if (modelType !== 'users')
      _throw({ code: 400, errors: [{ field: 'type', message: 'invalid' }], message: 'invalid type' });

    next();
  });
}

export default checkPermission;
