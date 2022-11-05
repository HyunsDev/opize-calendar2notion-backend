import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import statusRouter from './router/status';
import controlRouter from './router/control';
import { serverLogger } from '../../logger';

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
