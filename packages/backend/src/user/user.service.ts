import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CalendarEntity,
  EventEntity,
  UserEntity,
} from '@opize/calendar2notion-model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpService } from '@nestjs/axios';
import * as jwt from 'jsonwebtoken';
import { firstValueFrom } from 'rxjs';
import { stringify } from 'querystring';
import { calendar_v3, google } from 'googleapis';
import { AddCalendarDto } from './dto/add-calendar.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(CalendarEntity)
    private calendarsRepository: Repository<CalendarEntity>,
    @InjectRepository(EventEntity)
    private eventsRepository: Repository<EventEntity>,
    private readonly httpService: HttpService,
  ) {}

  async post(createUserDto: CreateUserDto) {
    const token = await this.getUserToken(createUserDto.token);
    const opizeUser = await this.getUserByOpize(token);

    let user =
      (await this.usersRepository.findOne({
        where: {
          opizeId: opizeUser.id,
        },
      })) || new UserEntity();

    user.name = opizeUser.name;
    user.email = opizeUser.email;
    user.imageUrl = opizeUser.imageUrl;
    user.opizeId = opizeUser.id;
    user.opizeAccessToken = token;
    user = await this.usersRepository.save(user);

    const userJWT = this.getUserJWT(user.id);
    return {
      token: userJWT,
    };
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(user: UserEntity) {
    if (user.status !== 'FINISHED') {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        opizeId: user.opizeId,
        googleEmail: user.googleEmail,
        notionDatabaseId: user.notionDatabaseId,
        lastCalendarSync: user.lastCalendarSync,
        lastSyncStatus: user.lastSyncStatus,
        status: user.status,
        isConnected: user.isConnected,
        userPlan: user.userPlan,
        userTimeZone: user.userTimeZone,
        notionProps: JSON.parse(user.notionProps || '{}'),
        isWork: user.isWork,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        calendars: [],
        allCalendars: [],
      };
    }

    const calendars = await this.calendarsRepository.find({
      where: {
        userId: user.id,
      },
    });

    const googleClient = await this.getGoogleClient(user);
    const allCalendarList_res = await googleClient.calendarList.list();
    const allCalendarList = allCalendarList_res.data.items.map((e) => {
      return {
        id: e.id,
        summary: e.summary,
        primary: e.primary,
        backgroundColor: e.backgroundColor,
        foregroundColor: e.foregroundColor,
        accessRole: e.accessRole as
          | 'none'
          | 'freeBusyReader'
          | 'reader'
          | 'writer'
          | 'owner',
      };
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      opizeId: user.opizeId,
      googleEmail: user.googleEmail,
      notionDatabaseId: user.notionDatabaseId,
      lastCalendarSync: user.lastCalendarSync,
      lastSyncStatus: user.lastSyncStatus,
      status: user.status,
      isConnected: user.isConnected,
      userPlan: user.userPlan,
      userTimeZone: user.userTimeZone,
      notionProps: JSON.parse(user.notionProps),
      isWork: user.isWork,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      calendars: calendars.map((calendar) => ({
        id: calendar.id,
        googleCalendarId: calendar.googleCalendarId,
        googleCalendarName: calendar.googleCalendarName,
        status: calendar.status,
        accessRole: calendar.accessRole,
        notionPropertyId: calendar.notionPropertyId,
        createdAt: calendar.createdAt,
      })),
      allCalendars: allCalendarList,
    };
  }

  async update(user: UserEntity, updateUserDto: UpdateUserDto) {
    if (updateUserDto.imageUrl) user.imageUrl = updateUserDto.imageUrl;
    if (updateUserDto.isConnected !== undefined)
      user.isConnected = updateUserDto.isConnected;
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.userTimeZone)
      user.userTimeZone = updateUserDto.userTimeZone;
    await this.usersRepository.save(user);
    return;
  }

  async addCalendar(user: UserEntity, addCalendarDto: AddCalendarDto) {
    const googleClient = await this.getGoogleClient(user);

    let googleCalendar: calendar_v3.Schema$CalendarListEntry;
    try {
      googleCalendar = (
        await googleClient.calendarList.get({
          calendarId: addCalendarDto.googleCalendarId,
        })
      ).data;
    } catch (err) {
      if (err.code === 404)
        throw new NotFoundException({
          code: 'calendar_not_found',
        });

      console.error(err);
      throw new InternalServerErrorException({
        code: `google_calendar_api_error_${err.code}`,
      });
    }

    const oldCalendar = await this.calendarsRepository.findOne({
      where: {
        userId: user.id,
        googleCalendarId: addCalendarDto.googleCalendarId,
      },
    });

    if (oldCalendar) {
      throw new BadRequestException({
        code: 'calendar_already_exist',
      });
    }

    const calendar = new CalendarEntity();
    calendar.accessRole = googleCalendar.accessRole as
      | 'none'
      | 'freeBusyReader'
      | 'reader'
      | 'writer'
      | 'owner';
    calendar.googleCalendarId = googleCalendar.id;
    calendar.googleCalendarName = googleCalendar.summary;
    calendar.status = 'DISCONNECTED';
    calendar.user = user;
    await this.calendarsRepository.save(calendar);

    return;
  }

  async removeCalendar(user: UserEntity, calendarId: number) {
    const calendar = await this.calendarsRepository.findOne({
      where: {
        id: calendarId,
        userId: user.id,
      },
    });

    if (!calendar)
      throw new NotFoundException({
        code: 'calendar_not_found',
      });

    if (user.isWork) {
      return {
        code: 'user_is_work',
      };
    }

    await this.eventsRepository.update(
      {
        willRemove: true,
      },
      {
        calendarId: calendar.id,
        userId: user.id,
      },
    );

    await this.calendarsRepository.remove(calendar);
    return;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  private async getUserToken(token: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.post(
          `${process.env.OPIZE_API_SERVER}/oauth`,
          {
            generateToken: token,
            redirectUrl: process.env.OPIZE_REDIRECT_URL,
          },
          {
            headers: {
              authorization: `Bearer ${process.env.OPIZE_PROJECT_SECRET_TOKEN}`,
            },
          },
        ),
      );
      return res.data.token;
    } catch (err) {
      console.log(err);
      if (err?.response?.status === 400) {
        throw new BadRequestException('opize oauth bad request');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  private async getUserByOpize(token: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${process.env.OPIZE_API_SERVER}/oauth/user`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
    );

    return res.data as {
      id: number;
      name: string;
      email: string;
      imageUrl: string;
      status: string;
      currency: string;
    };
  }

  private getUserJWT(userId: number) {
    const JWTToken = jwt.sign(
      {
        id: userId,
        type: 'projectUser',
      },
      process.env.JWT_SECRET as string,
      {
        issuer: 'calendar2notion.opize.me',
        subject: 'user',
      },
    );
    return JWTToken;
  }

  private async getGoogleClient(user: UserEntity) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_PASSWORD,
      process.env.GOOGLE_CALLBACK,
    );
    oAuth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
    const googleClient = google.calendar({ version: 'v3', auth: oAuth2Client });
    return googleClient;
  }

  verify(JWTString: string) {
    try {
      const payload = jwt.verify(JWTString, process.env.JWT_SECRET) as (
        | jwt.JwtPayload
        | string
      ) & {
        id: string;
        type: string;
      };
      const { id, type } = payload;
      return {
        userId: id,
        type: type,
      };
    } catch (e) {
      throw new UnauthorizedException({
        code: 'wrong_token',
      });
    }
  }
}
