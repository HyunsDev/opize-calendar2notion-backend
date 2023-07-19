import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEntity, UserEntity } from '@opize/calendar2notion-object';
import { getGoogleCalendarTokensByUser } from 'src/common/api-client/googleCalendarToken';
import { NotionClient } from 'src/common/api-client/notion.client';
import { Repository } from 'typeorm';

import { GoogleCalendarClient } from '../../../../../../common/api-client/googleCalendar.client';

import { FetchEventResDto } from './dto/getEvent.res.dto';

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

        const tokens = getGoogleCalendarTokensByUser(user);

        const googleCalendarEvent = await this.getGoogleCalendarEventById(
            event.googleCalendarCalendarId,
            event.googleCalendarEventId,
            {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                callbackUrl: tokens.callbackUrl,
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
            callbackUrl: string;
        },
    ) {
        const client = new GoogleCalendarClient(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.callbackUrl,
        );

        return await client.getEvent(calendarId, eventId);
    }

    private async getNotionPageById(pageId: string, accessToken: string) {
        const client = new NotionClient(accessToken);
        return await client.getPage(pageId);
    }
}
