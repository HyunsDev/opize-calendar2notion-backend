import express from 'express';
import cors from 'cors';

import statusRouter from './router/status';
import controlRouter from './router/control';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/status', statusRouter);
app.use('/control', controlRouter);
app.get('/', (req, res) => {
    res.send('Hello, Opize!');
});

export default app;
