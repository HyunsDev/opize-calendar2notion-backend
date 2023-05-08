import { Controller, Get, Query } from '@nestjs/common';
import { Migration1Service } from './migration1.service';
import { Auth } from '../user/decorator/auth.decorator';

@Controller('migrations/v1')
@Auth()
export class Migration1Controller {
    constructor(private readonly migration1Service: Migration1Service) {}

    @Get('check')
    async migrateCheck(@Query('userId') userId: number) {
        return await this.migration1Service.migrateCheck(+userId);
    }
}
