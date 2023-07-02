import { Body, Controller, Param, Post } from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';

import { PlanUpgradeReqDto } from './dto/planUpgrade.req.dto';
import { AdminUserPlanService } from './plan.service';

@Controller('admin/users/:userId/plan')
@Auth('admin')
export class AdminUserPlanController {
    constructor(private readonly adminUserEventService: AdminUserPlanService) {}

    @Post('')
    async upgradePlan(
        @Param('userId') userId: string,
        @Body() dto: PlanUpgradeReqDto,
    ) {
        return await this.adminUserEventService.upgradePlan(+userId, dto);
    }
}
