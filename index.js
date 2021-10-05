const express = require("express");
const helmet = require("helmet");
const winston = require('winston');
const expressWinston = require('express-winston');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.label({ label: 'server'}),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    },
  )),
  meta: false,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
}));

app.use('/api', routes);

app.listen(8000, () => {
  console.info('Listening on 8000');
});
