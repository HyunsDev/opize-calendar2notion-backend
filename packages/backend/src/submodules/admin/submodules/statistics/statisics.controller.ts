import { Controller, Get } from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';

import { AdminStatisticsService } from './statistics.service';

@Controller('admin/statistics')
@Auth('admin')
export class AdminStatisticsController {
    constructor(
        private readonly adminStatisticsService: AdminStatisticsService,
    ) {}

    @Get('')
    async getStatistics() {
        return await this.adminStatisticsService.getStatistics();
    }
}
