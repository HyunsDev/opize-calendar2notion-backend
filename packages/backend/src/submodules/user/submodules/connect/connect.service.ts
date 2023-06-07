import axios, { AxiosError } from 'axios';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CalendarEntity,
    NotionWorkspaceEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpService } from '@nestjs/axios';
import * as jwt from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';
import { google } from 'googleapis';
import { GoogleAccountDTO } from './dto/googleAccount.dto';
import { NotionAccountDTO } from './dto/notionAccount.dto';
import { Client } from '@notionhq/client';
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserConnectService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(CalendarEntity)
        private calendarsRepository: Repository<CalendarEntity>,
        @InjectRepository(NotionWorkspaceEntity)
        private notionWorkspaceRepository: Repository<NotionWorkspaceEntity>,

        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {}

    async googleAccount(googleAccountDto: GoogleAccountDTO, user: UserEntity) {
        const oAuth2Client = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_PASSWORD'),
            this.configService.get('GOOGLE_CALLBACK'),
        );
        const googleTokens = await oAuth2Client.getToken(googleAccountDto);

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
        user.googleRedirectUrlVersion = this.configService.get(
            'GOOGLE_CALLBACK_VERSION',
        );
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
                        redirect_uri: this.configService.get('NOTION_CALLBACK'),
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
                workspace = new NotionWorkspaceEntity({
                    workspaceId: res.data.workspace_id,
                    accessToken: res.data.access_token,
                    botId: res.data.bot_id,
                    tokenType: res.data.token_type,
                });
            }

            workspace.accessToken = res.data.access_token;
            workspace.botId = res.data.bot_id;
            workspace.tokenType = res.data.token_type;
            await this.notionWorkspaceRepository.save(workspace);

            user.notionDatabaseId = res.data.duplicated_template_id;
            user.status = 'NOTION_API_SET';
            user.notionWorkspace = workspace;
            await this.usersRepository.save(user);
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
            user.notionWorkspace.accessToken || user.notionAccessToken;

        if (!notionAccessToken) {
            throw new BadRequestException({
                code: 'need_notion_oauth',
            });
        }

        const notion = new Client({
            auth: notionAccessToken,
        });

        let databaseResponse: GetDatabaseResponse;

        try {
            databaseResponse = await notion.databases.retrieve({
                database_id: user.notionDatabaseId,
            });
        } catch (err) {
            if (err.code === 'object_not_found') {
                throw new BadRequestException({
                    code: 'database_not_found',
                });
            } else {
                throw err;
            }
        }

        const props = {
            title: 'title',
            calendar: 'select',
            date: 'date',
            delete: 'checkbox',
            location: 'rich_text',
            description: 'rich_text',
        };

        const propsId = {
            title: '',
            calendar: '',
            date: '',
            delete: '',
            location: '',
            description: '',
        };

        let propsList = Object.keys(props);
        for (const prop in props) {
            if (
                databaseResponse.properties[prop] &&
                databaseResponse.properties[prop].type == props[prop]
            ) {
                propsList = propsList.filter((e) => e !== prop);
                propsId[prop] = databaseResponse.properties[prop].id;
            }
        }

        if (propsList.length !== 0) {
            const errorProps = {};
            for (const prop of propsList) {
                errorProps[prop] = props[prop];
            }

            throw new BadRequestException({
                code: 'wrong_props',
                errorProps,
            });
        }

        // 구글 캘린더 등록
        const oAuth2Client = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_PASSWORD'),
            this.configService.get('GOOGLE_CALLBACK'),
        );
        oAuth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
        });
        const googleClient = google.calendar({
            version: 'v3',
            auth: oAuth2Client,
        });
        const allCalendarList_res = await googleClient.calendarList.list({
            minAccessRole: 'writer',
        });
        const allCalendarList = allCalendarList_res.data.items
            .filter((e) => e.primary)
            .map((e) => {
                return {
                    id: e.id,
                    summary: e.summary,
                    primary: e.primary,
                    accessRole: e.accessRole,
                };
            });

        for (const newCalendar of allCalendarList) {
            const calendar =
                (await this.calendarsRepository.findOne({
                    where: {
                        userId: user.id,
                        googleCalendarId: newCalendar.id,
                    },
                })) || new CalendarEntity();
            calendar.accessRole = 'owner';
            calendar.googleCalendarId = newCalendar.id;
            calendar.googleCalendarName = newCalendar.summary;
            calendar.status = 'PENDING';
            calendar.user = user;
            await this.calendarsRepository.save(calendar);
        }

        // 유저 업데이트
        user.isConnected = true;
        user.notionProps = JSON.stringify(propsId);
        user.status = 'FINISHED';
        await this.usersRepository.save(user);

        return;
    }
}
