import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';

import logger from './src/util/logger.js';
import routes from './src/routes/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: {
    write: message => {
      logger.http(message.trim());
    }
  }
}));

app.use('/', routes);

app.get('/health', (req: Request, res: Response) => {
    res.sendStatus(200);
});

// --- Global Error Handler (Must be the last middleware) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access it at: http://localhost:${PORT}`);
});