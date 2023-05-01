import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Query,
} from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';
import { AdminUserEventService } from './event.service';
import { GetEventReqDto } from './dto/getEvent.req.dto';

@Controller('admin/:userId/events')
@Auth('admin')
export class AdminUserEventController {
    constructor(private readonly adminEventService: AdminUserEventService) {}

    @Get('')
    async getEvent(
        @Param() dto: GetEventReqDto,
        @Query('userId') userId: string,
    ) {
        if (dto.eventLinkId) {
            return await this.adminEventService.getEventByEventLinkId(
                +dto.eventLinkId,
                +userId,
            );
        } else if (dto.googleCalendarEventId) {
            // return await this.adminEventService.getEventByGoogleCalendarEventId(
            //     dto.googleCalendarEventId,
            //     +dto.userId,
            // );
        } else if (dto.notionPageId) {
            // return await this.adminEventService.getEventByNotionPageId(
            //     dto.notionPageId,
            //     +dto.userId,
            // );
        }

        throw new BadRequestException(
            'eventLinkId, googleCalendarEventId, notionPageId 중 하나는 필수입니다.',
        );
    }
}
