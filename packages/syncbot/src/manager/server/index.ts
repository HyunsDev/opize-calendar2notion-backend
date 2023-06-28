import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { serverLogger } from '../../logger';

import controlRouter from './router/control';
import statusRouter from './router/status';

const app = express();
app.use(
    morgan('combined', {
        stream: {
            write: (meta: any) => serverLogger.info(meta),
        },
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/status', statusRouter);
app.use('/control', controlRouter);
app.get('/', (req, res) => {
    res.send('Hello, Opize!');
});

export default app;
