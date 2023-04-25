import { Injectable } from '@nestjs/common';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-model';
import { Client } from '@notionhq/client';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AdminNotionService {
    getNotionClient(userAccessToken: string) {
        return new Client({ auth: userAccessToken });
    }
}
