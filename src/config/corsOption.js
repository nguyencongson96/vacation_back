const whiteList = [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin === 'null' || whiteList.indexOf(origin) !== -1) return callback(null, true);
    else return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
};

export default corsOptions;
