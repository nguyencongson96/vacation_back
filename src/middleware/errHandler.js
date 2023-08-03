const errHandler = (err, req, res, next) => {
  console.log(err.stack); // Log the error stack trace to the console

  const { errors, message, meta, code } = err;
  switch (err.name) {
    // If the error is a validation error, return a 400 Bad Request status code with the validation errors as JSON
    case 'ValidationError':
      const result = Object.keys(err.errors).reduce(
        (obj, key) => Object.assign(obj, { [key]: err.errors[key].message }),
        {}
      );
      return res.status(400).json({ errors: result, meta, message: 'Validation Error' });

    case 'TypeError':
      return res.status(400).json({ errors: err.message, meta, message: 'TypeError' });

    case 'CastError':
      return res.status(400).json({
        errors: [{ field: err.path, message: `Cast failed for value ${err.value}` }],
        meta,
        message: 'CastError',
      });

    case 'MongooseError':
      return res.status(500).json({ errors: err.message, message: 'Database Error' });

    case 'MongoServerError':
      return res.status(500).json({ errors: err.message, message: 'Database Error' });

    case 'MulterError':
      return res.status(400).json({ errors: err.message, message: 'MulterError' });

    case 'FirebaseError':
      return res.status(500).json({ errors: err.message, message: 'FirebaseError' });

    default:
      return res.status(code || 500).json({ errors, meta, message });
  }
};

export default errHandler;
