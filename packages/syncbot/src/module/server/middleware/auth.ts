import { Request, Response, NextFunction } from 'express';
import { env } from '@/env/env';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (
        typeof authorization === 'string' &&
        authorization.split('Bearer ')[1] === env.SYNCBOT_CONTROL_SECRET
    ) {
        next();
        return;
    } else {
        res.status(403).send({
            code: 'wrong_authorization',
        });
    }
};
