const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

const logger = require('./services/logger');
logger.init(true);

const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const morganMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  { 
    stream: {
      write: (message) => logger.http(message),
    }
  },
);
app.use(morganMiddleware);

app.use('/api', routes);

app.use((err, req, res, next) => {
  logger.error(err);
  res.sendStatus(500);
  next();
});

const port = process.env.PORT || 8000;
app.listen(process.env.PORT || 8000, () => {
  console.info(`Listening on ${port}`);
});
