import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const handleUpload = asyncWrapper(async (req, res, next) => {
  const { field } = req.body;

  //Throw an error if user has not uploaded any file
  (!req.files || req.files.length < 1) && _throw({ code: 400, message: 'user has not upload yet' });

  //Throw an error if user upload more than 1 file not for post
  req.files.length > 1 && field !== 'post' && _throw({ code: 400, message: 'can only upload 1 file' });

  //Throw an error if user try to upload video not for post
  field !== 'post' &&
    req.files.forEach(file => {
      ['video/mp4', 'video/mov'].includes(file.mimetype) && _throw({ code: 400, message: 'cannot upload video file' });
    });

  let filesArr = [];
  for (const file of req.files) {
    const { originalname, buffer } = file;

    //Create random unique Suffix
    const maxLength = 6;
    const ranNumber = Math.round(Math.random() * (Math.pow(10, maxLength) - 1));
    const uniqueSuffix = Date.now() + '-' + String(ranNumber).padStart(maxLength, '0');

    //Define location to upload file
    const path = `${uniqueSuffix}/${originalname}`;
    const storageRef = ref(getStorage(), path);

    //Upload file
    const result = await uploadBytes(storageRef, buffer);

    //Get url and transmit url to next middleware
    const url = await getDownloadURL(result.ref);

    //Add key url to each file of fileUpload
    file.url = url;

    //Push file to filesArr has already declared above
    filesArr.push(file);
  }

  //Send filesArr to next middleware
  req.filesArr = filesArr;

  //Next to middleware
  next();
});

export default handleUpload;
