import express from 'express';
import vacationController from '#root/controller/vacation/vacation';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import viewController from '#root/controller/interaction/views';
import albumspagesController from '#root/controller/albumspages';
import checkFriend from '#root/middleware/checkForbidden/checkFriend';
const router = express.Router();

router.use(verifyJWT);
router.route('/').get(vacationController.getMany).post(checkFriend(), vacationController.addNew);

router.get(
  '/:id/images',
  checkPermission({ modelType: 'vacations', listType: 'shareList' }),
  albumspagesController.getalbumspagesvacations
);

router
  .route('/:id')
  .get(
    checkPermission({ modelType: 'vacations', listType: 'shareList' }),
    viewController.update('vacations'),
    vacationController.getOne
  )
  .put(checkAuthor({ modelType: 'vacations' }), checkFriend(), vacationController.update)
  .delete(checkAuthor({ modelType: 'vacations' }), vacationController.delete);

export default router;
