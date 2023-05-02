import { Controller, Get } from '@nestjs/common';
import { Migration1Service } from './migration1.service';

@Controller('migrations/v1')
export class Migration1Controller {
    constructor(private readonly migration1Service: Migration1Service) {}

    @Get('')
    async migrateTest() {
        return await this.migration1Service.migrate(259);
    }
}
