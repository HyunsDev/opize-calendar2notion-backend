import { Injectable } from '@nestjs/common';
import { Migration1Query } from './migration1query.service';

@Injectable()
export class Migration1Service {
    constructor(private readonly queryManager: Migration1Query) {}

    async migrate(userId: number) {
        // const user = await this.queryManager.findOneUser(userId);
        // console.log(user);
        // return user.calendars;

        const events = await this.queryManager.findEvents(userId, 1);
        const eventSum = await this.queryManager.findEventsSum(userId);
        return events;
    }
}
