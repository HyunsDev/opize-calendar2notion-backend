import { Response } from 'express';

export class Migration1StreamHelper {
    private res: Response;

    constructor(res: Response) {
        this.res = res;
    }

    send(data: {
        migrationStatus: 'progress' | 'done' | 'error';
        step:
            | 'user_data_fetching'
            | 'notion_database_migrating'
            | 'event_migrating';
        message: string;
    }) {
        this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    end() {
        this.res.end();
    }
}
