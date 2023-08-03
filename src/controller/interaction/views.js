import Views from '#root/model/interaction/views';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';

const viewController = {
  update: ({ modelType }) =>
    asyncWrapper(async (req, res, next) => {
      const { id } = req.params;

      const foundView = await Views.findOne({ modelType, modelId: id, userId: req.userInfo._id });

      //If view can be found, then increase view by 1, if view is already hit to max_view, then do not increase
      if (foundView && foundView.quantity < process.env.MAX_VIEW) {
        foundView.quantity += 1;
        await foundView.save();
      }

      //If view not found, then create a new view with default view is 1
      else await Views.create({ modelType, modelId: id, userId: req.userInfo._id, createdAt: new Date() });

      next();
    }),
};

export default viewController;
