import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    message: 'Hello there',
  });
});

router.get('/test', (req, res) => {
  res.sendStatus(200);
});

export default router;
