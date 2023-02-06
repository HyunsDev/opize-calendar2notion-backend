import { UserEntity } from '@opize/calendar2notion-model';
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * JWT의 내용이 들어갑니다.
       */
      token?: any;
      /**
       * user 정보가 들어갑니다.
       */
      user?: UserEntity;
    }

    interface Response {
      sse?: any;
    }
  }
}
