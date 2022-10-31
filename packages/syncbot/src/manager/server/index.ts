import express from 'express';
import cors from 'cors';

import statusRouter from './router/status';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/status', statusRouter);

export default app;
