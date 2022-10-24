import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { DB, AppDataSource } from '../database';
import { NotionAssist } from './assist/notionAssist';
import { DatabaseAssist } from './assist/databaseAssist';
import { GoogleCalendarAssist } from './assist/googleCalendarAssist';
import { EventLinkAssist } from './assist/eventLinkAssest';
import { Worker } from '.';

dayjs.extend(utc);
dayjs.extend(timezone);

(async () => {
    const user = new UserEntity();
    user.name = 'TEST';
    user.email = 'hyunsdev.test@gmail.com';
    user.imageUrl = '';
    user.googleId = '108427634275192649945';
    user.googleAccessToken =
        'ya29.A0ARrdaM-DIkjlGztbq539ZiWcI0lMD1br4bv1Bk3QkCqnZJZgyVyNuHDEBTzAAAUdlmjkREEnHAvdUW8IiTm42uacHMnaEvdndApJBdv0P591yB4SvMewg_c1Mubek1GNHTiacs2ZcKg-DoGuDTeZwvjREIOt';
    user.googleRefreshToken =
        '1//0eqtw-9TUpTmmCgYIARAAGA4SNwF-L9IrCQT1JK8O0oUsemIopLzD_uAbwne2GamDEoAU3XKNVX9KpYcMs--qmdHz86RWwl6ScqM';
    user.notionAccessToken =
        'secret_T4r7TqeB36Nh3lWXUDKi1RX4JVWcV3KiG4TRCFlscJ2';
    user.notionBotId = 'fa6192d8-9c35-41fd-a782-c05967dbdfec';
    user.notionDatabaseId = '4453bfc778544847b007e1168b83855a';
    user.lastCalendarSync = new Date('2022-10-17 10:03:26');
    user.status = 'FINISHED';
    user.isConnected = true;
    user.userPlan = 'PRO';
    user.userTimeZone = 'Asia/Seoul';
    user.notionProps = JSON.stringify({
        title: 'title',
        calendar: 'TPCN',
        delete: 'zst%5E',
        date: 'EhtZ',
    });
    user.isWork = false;

    // const res = await DB.user.find();

    await AppDataSource.initialize();
    await DB.user.delete({
        email: 'hyunsdev.test@gmail.com',
    });
    const res = await DB.user.save(user);

    const worker = new Worker(res.id);
    const ress = await worker.run();

    console.log(ress);
})();
