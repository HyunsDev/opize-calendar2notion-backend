import { Embed, Webhook } from '@hyunsdev/discord-webhook';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '@notionhq/client';
import {
    CalendarEntity,
    NotionWorkspaceEntity,
    UserEntity,
} from '@opize/calendar2notion-entity';
import { AxiosError } from 'axios';
import * as dayjs from 'dayjs';
import { google } from 'googleapis';
import { firstValueFrom } from 'rxjs';
import { GoogleCalendarClient } from 'src/common/api-client/googleCalendar.client';
import { getGoogleCalendarTokensByUser } from 'src/common/api-client/googleCalendarToken';
import { NotionClient } from 'src/common/api-client/notion.client';
import { Repository } from 'typeorm';

import { UserConnectNotionService } from './connect-notion.service';
import { GoogleAccountDTO } from './dto/googleAccount.dto';
import { NotionAccountDTO } from './dto/notionAccount.dto';

@Injectable()
export class UserConnectService {
    webhook: Webhook;

    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(CalendarEntity)
        private calendarsRepository: Repository<CalendarEntity>,
        @InjectRepository(NotionWorkspaceEntity)
        private notionWorkspaceRepository: Repository<NotionWorkspaceEntity>,

        private readonly connectNotionService: UserConnectNotionService,

        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.webhook = new Webhook(
            process.env.DISCORD_WEBHOOK_CONNECT_NOTICE_URL,
            'Calendar2notion Backend',
            process.env.DISCORD_WEBHOOK_ICON_URL,
        );
    }

    async googleAccount(googleAccountDto: GoogleAccountDTO, user: UserEntity) {
        const googleCallbackVersion = googleAccountDto?.callbackVersion || 1;
        const googleCallback =
            this.configService.get('GOOGLE_CALLBACKS')[
                `${googleCallbackVersion}`
            ];

        if (!googleCallback) {
            throw new BadRequestException({
                code: 'invalid_google_callback_version',
            });
        }

        const oAuth2Client = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_PASSWORD'),
            googleCallback,
        );
        const googleTokens = await oAuth2Client.getToken({
            code: googleAccountDto.code,
        });

        oAuth2Client.setCredentials({
            access_token: googleTokens.tokens.access_token,
            refresh_token: googleTokens.tokens.refresh_token,
        });

        const oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2',
        });

        const isHasCalendarScope = (
            await oauth2.tokeninfo({
                access_token: googleTokens.tokens.access_token,
            })
        ).data.scope.includes('https://www.googleapis.com/auth/calendar');

        const userProfileRes = await oauth2.userinfo.get();
        const userProfile = userProfileRes.data;

        if (!isHasCalendarScope) {
            throw new BadRequestException({
                code: 'need_google_calendar_permission',
            });
        }

        const oldUser = await this.usersRepository.findOne({
            where: {
                googleId: userProfile.id,
            },
        });
        if (oldUser && oldUser.id !== user.id) {
            throw new BadRequestException({
                code: 'already_account_exist',
            });
        }

        user.googleAccessToken = googleTokens.tokens.access_token;
        user.googleRefreshToken = googleTokens.tokens.refresh_token;
        user.googleId = userProfile.id;
        user.googleEmail = userProfile.email;
        user.googleRedirectUrlVersion = googleCallbackVersion;
        user.syncYear = dayjs().year();
        user = await this.usersRepository.save(user);

        return;
    }

    async notionAccount(notionAccountDto: NotionAccountDTO, user: UserEntity) {
        const authorizationCode = Buffer.from(
            this.configService.get('NOTION_CLIENT_ID') +
                ':' +
                this.configService.get('NOTION_CLIENT_SECRET'),
            'utf8',
        ).toString('base64');

        try {
            const res = await firstValueFrom(
                this.httpService.post(
                    `https://api.notion.com/v1/oauth/token`,
                    {
                        code: notionAccountDto.code,
                        grant_type: 'authorization_code',
                        redirect_uri: notionAccountDto.redirectUrl,
                    },
                    {
                        headers: {
                            'content-type': 'application/json',
                            authorization: `Basic ${authorizationCode}`,
                        },
                    },
                ),
            );

            let workspace = await this.notionWorkspaceRepository.findOne({
                where: {
                    workspaceId: res.data.workspace_id,
                },
            });

            if (!workspace) {
                workspace = NotionWorkspaceEntity.create({
                    workspaceId: res.data.workspace_id,
                    accessToken: res.data.access_token,
                    botId: res.data.bot_id,
                    tokenType: res.data.token_type,
                });
            }

            workspace.accessToken = res.data.access_token;
            workspace.botId = res.data.bot_id;
            workspace.tokenType = res.data.token_type;
            workspace = await this.notionWorkspaceRepository.save(workspace);

            await this.usersRepository.update(
                {
                    id: user.id,
                },
                {
                    notionDatabaseId: res.data.duplicated_template_id,
                    status: 'NOTION_API_SET',
                    notionWorkspace: workspace,
                },
            );
            return;
        } catch (err) {
            console.log(err);
            if (err instanceof AxiosError) {
                throw new BadRequestException({
                    code: 'notion_oauth_error',
                });
            } else {
                throw err;
            }
        }
    }

    async getNotionDatabases(user: UserEntity) {
        const notionAccessToken =
            user.notionWorkspace.accessToken || user.notionAccessToken;

        if (!notionAccessToken) {
            throw new BadRequestException({
                code: 'need_notion_oauth',
            });
        }

        const notion = new Client({
            auth: notionAccessToken,
        });

        try {
            const notionDatabases = await notion.search({
                filter: {
                    value: 'database',
                    property: 'object',
                },
                sort: {
                    timestamp: 'last_edited_time',
                    direction: 'descending',
                },
            });
            return {
                databases: notionDatabases.results,
            };
        } catch (err) {
            console.log(err);
            if (err instanceof AxiosError) {
                throw new BadRequestException({
                    code: 'notion_oauth_error',
                });
            } else {
                throw err;
            }
        }
    }

    async setNotionDatabase(user: UserEntity) {
        const notionAccessToken =
            this.connectNotionService.getNotionAccessToken(user);

        if (!notionAccessToken) {
            throw new BadRequestException({
                code: 'need_notion_oauth',
            });
        }

        const notionClient = new NotionClient(notionAccessToken);

        const databaseResponse = await notionClient.getDatabase(
            user.notionDatabaseId,
        );

        if (!databaseResponse) {
            throw new BadRequestException({
                code: 'database_not_found',
            });
        }

        const propsId =
            this.connectNotionService.getNotionDatabasePropIds(
                databaseResponse,
            );

        // 구글 캘린더 등록
        const googleTokens = getGoogleCalendarTokensByUser(user);
        const googleClient = new GoogleCalendarClient(
            googleTokens.accessToken,
            googleTokens.refreshToken,
            googleTokens.callbackUrl,
        );

        const allCalendarList_res = await googleClient.getWriteableCalendars();
        const allCalendarList = allCalendarList_res.data.items
            .filter((e) => e.primary)
            .map((e) => ({
                id: e.id,
                summary: e.summary,
                primary: e.primary,
                accessRole: e.accessRole,
            }));

        for (const newCalendar of allCalendarList) {
            let calendar = await this.calendarsRepository.findOne({
                where: {
                    userId: user.id,
                    googleCalendarId: newCalendar.id,
                },
            });

            if (calendar) {
                calendar.accessRole =
                    newCalendar.accessRole as CalendarEntity['accessRole'];
                calendar.googleCalendarName = newCalendar.summary;
                await this.calendarsRepository.save(calendar);
                continue;
            } else {
                calendar = CalendarEntity.create({
                    accessRole:
                        newCalendar.accessRole as CalendarEntity['accessRole'],
                    googleCalendarId: newCalendar.id,
                    googleCalendarName: newCalendar.summary,
                    user,
                });
                await this.calendarsRepository.save(calendar);
            }
        }

        // 유저 업데이트
        user.isConnected = true;
        user.notionProps = JSON.stringify(propsId);
        user.status = 'FINISHED';
        await this.usersRepository.save(user);

        const embed: Embed = new Embed({
            title: '유저 연결 완료',
            fields: [
                {
                    name: 'User',
                    value: `${user.id}. ${user.name}(${user.email})`,
                },
            ],
            thumbnail: {
                url: user.imageUrl,
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: `calendar2notion v${process.env.npm_package_version}`,
                icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
            },
            color: 0x03fc6f,
        });

        await this.webhook.send('', [embed]);

        return;
    }

    async connectExistNotionDatabase(
        user: UserEntity,
        notionDatabaseId: string,
    ) {
        // 노션 데이터베이스 정보 가져오기
        const notionAccessToken =
            this.connectNotionService.getNotionAccessToken(user);
        const notionClient = new NotionClient(notionAccessToken);
        const databaseResponse = await notionClient.getDatabase(
            notionDatabaseId,
        );
        if (!databaseResponse) {
            throw new BadRequestException({
                code: 'database_not_found',
            });
        }

        const propsId =
            this.connectNotionService.getNotionDatabasePropIds(
                databaseResponse,
            );

        // 구글 캘린더 정보 가져오기
        const googleTokens = getGoogleCalendarTokensByUser(user);
        const googleClient = new GoogleCalendarClient(
            googleTokens.accessToken,
            googleTokens.refreshToken,
            googleTokens.callbackUrl,
        );
        const writeableCalendarsRes =
            await googleClient.getWriteableCalendars();
        const primaryCalendars = writeableCalendarsRes.data.items
            .filter((e) => e.primary)
            .map((e) => ({
                id: e.id,
                summary: e.summary,
                primary: e.primary,
                accessRole: e.accessRole,
            }));

        for (const calendar of primaryCalendars) {
            const existCalendar = await this.calendarsRepository.findOne({
                where: {
                    userId: user.id,
                    googleCalendarId: calendar.id,
                },
            });

            if (existCalendar) {
                existCalendar.accessRole =
                    calendar.accessRole as CalendarEntity['accessRole'];
                existCalendar.googleCalendarName = calendar.summary;
                await this.calendarsRepository.save(existCalendar);
            } else {
                const newCalendar = CalendarEntity.create({
                    accessRole:
                        calendar.accessRole as CalendarEntity['accessRole'],
                    googleCalendarId: calendar.id,
                    googleCalendarName: calendar.summary,
                    user,
                });
                await this.calendarsRepository.save(newCalendar);
            }
        }

        // 유저 업데이트
        user.isConnected = true;
        user.notionProps = JSON.stringify(propsId);
        user.notionDatabaseId = notionDatabaseId;
        user.status = 'FINISHED';
        await this.usersRepository.save(user);
        return;
    }
}
