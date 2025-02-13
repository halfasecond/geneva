import bodyParser from 'body-parser';
import cors from 'cors';

const { CORS_ORIGINS, NODE_ENV } = process.env;

const configureExpress = (app) => {
  const corsOptions = NODE_ENV === 'production' ? {
    origin: CORS_ORIGINS ? CORS_ORIGINS.split(',') : [], // Ensure CORS_ORIGINS is defined
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Origin", "X-Requested-With", "Accept", "x-api-key", "Authorization"],
    credentials: true,
  } : {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Origin", "X-Requested-With", "Accept", "x-api-key", "Authorization"],
  };

  app.use(cors(corsOptions));

  if (NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
      } else {
        next();
      }
    });
  }

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
};

export default configureExpress;