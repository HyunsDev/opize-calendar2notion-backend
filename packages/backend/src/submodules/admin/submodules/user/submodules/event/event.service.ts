import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { Repository } from 'typeorm';
import { FetchEventResDto } from './dto/getEvent.res.dto';
import { GoogleCalendarClient } from '../../../../../../common/api-client/googleCalendar.client';
import { NotionClient } from 'src/common/api-client/notion.client';

@Injectable()
export class AdminUserEventService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(EventEntity)
        private eventsRepository: Repository<EventEntity>,
    ) {}

    /**
     * 이벤트링크 Id를 통해 이벤트를 가져옵니다.
     * @param eventLinkId
     * @param tokens
     * @returns
     */
    async getEventByEventLinkId(
        eventLinkId: number,
        userId: number,
    ): Promise<FetchEventResDto> {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });

        const event = await this.eventsRepository.findOne({
            where: {
                id: eventLinkId,
            },
            relations: ['user'],
        });

        if (!event) {
            throw new NotFoundException({
                message: '이벤트를 찾을 수 없어요',
            });
        }

        const googleCalendarEvent = await this.getGoogleCalendarEventById(
            event.googleCalendarCalendarId,
            event.googleCalendarEventId,
            {
                accessToken: user.googleAccessToken,
                refreshToken: user.googleRefreshToken,
            },
        );

        const notionPage = await this.getNotionPageById(
            event.notionPageId,
            user.notionAccessToken,
        );

        return {
            eventLink: event,
            gCalEvent: googleCalendarEvent,
            notionPage: notionPage,
        };
    }

    private async getGoogleCalendarEventById(
        calendarId: string,
        eventId: string,
        tokens: {
            accessToken: string;
            refreshToken: string;
        },
    ) {
        const client = new GoogleCalendarClient(
            tokens.accessToken,
            tokens.refreshToken,
        );

        return await client.getEvent(calendarId, eventId);
    }

    private async getNotionPageById(pageId: string, accessToken: string) {
        const client = new NotionClient(accessToken);
        return await client.getPage(pageId);
    }
}
