import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';

import { GetErrorsReqDto } from './dto/getErrors.req.dto';
import { AdminErrorService } from './error.service';

@Controller('admin/errors')
@Auth('admin')
export class AdminErrorController {
    constructor(private readonly adminErrorService: AdminErrorService) {}

    @Get('')
    async getErrors(@Query() dto: GetErrorsReqDto) {
        return await this.adminErrorService.getErrors(
            +dto.page,
            +dto.pageSize,
            {
                userId: dto.userId ? +dto.userId : undefined,
            },
        );
    }
}
