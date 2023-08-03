import multer from 'multer';
import _throw from '#root/utils/_throw';
import Resources from '#root/model/resource/resource';

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 7 * 1000 * 1000 },
  fileFilter: async (req, file, callback) => {
    const fileSize = parseInt(req.headers['content-length']);

    const { originalname, mimetype, size } = file;

    //Throw an error in case of invalid contentType
    if (!['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/mov'].includes(mimetype))
      return callback({ code: 400, message: 'invalid contentType' });

    //Throw an error if file is too large
    if (
      (['image/png', 'image/jpg', 'image/jpeg'].includes(mimetype) && fileSize > 7 * 1024 * 1024) ||
      (['video/mp4', 'video/mov'].includes(mimetype) && fileSize > 15 * 1024 * 1024)
    )
      return callback({ code: 400, message: 'file too large' });

    //Validate before saving to DB
    const newResource = new Resources({
      name: originalname,
      type: mimetype,
      size: size,
      path: 'path',
      userId: req.userInfo._id,
      ref: [],
    });

    await newResource.validate();

    return callback(null, true);
  },

  //Next Error if error occur
  onError: function (err, next) {
    next(err);
  },
});

export default multerUpload;
