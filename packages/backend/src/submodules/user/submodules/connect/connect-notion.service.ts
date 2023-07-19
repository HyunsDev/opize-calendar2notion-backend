import { Webhook } from '@hyunsdev/discord-webhook';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import {
    CalendarEntity,
    NotionWorkspaceEntity,
    UserEntity,
} from '@opize/calendar2notion-object';
import { Repository } from 'typeorm';

export type NotionPropName = 'title' | 'calendar' | 'date' | 'delete';

export type NotionProp = {
    name: NotionPropName;
    id: string;
    type: 'title' | 'rich_text' | 'number' | 'select' | 'multi_select';
    [key: string]: any;
};
export type NotionProps = Partial<Record<NotionPropName, NotionProp>>;

const propsTypes = {
    title: 'title',
    calendar: 'select',
    date: 'date',
    delete: 'checkbox',
} as const;

@Injectable()
export class UserConnectNotionService {
    webhook: Webhook;

    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(CalendarEntity)
        private calendarsRepository: Repository<CalendarEntity>,
        @InjectRepository(NotionWorkspaceEntity)
        private notionWorkspaceRepository: Repository<NotionWorkspaceEntity>,
    ) {
        this.webhook = new Webhook(
            process.env.DISCORD_WEBHOOK_CONNECT_NOTICE_URL,
            'Calendar2notion Backend',
            process.env.DISCORD_WEBHOOK_ICON_URL,
        );
    }

    public getNotionAccessToken(user: UserEntity) {
        return user.notionWorkspace.accessToken || user.notionAccessToken;
    }

    public getNotionDatabasePropIds(database: GetDatabaseResponse) {
        const props = this.getProps(database);
        const propsValid = this.checkPropsValid(props);

        if (!propsValid.isValid) {
            throw new BadRequestException({
                code: 'wrong_props',
                props: propsValid.props,
            });
        }

        return {
            title: props.title.id,
            calendar: props.calendar.id,
            date: props.date.id,
            delete: props.delete.id,
        };
    }

    private getProps(database: GetDatabaseResponse): NotionProps {
        const propsNames = ['title', 'calendar', 'date', 'delete'];

        const props: NotionProps = {};

        for (const propName of propsNames) {
            if (propName === 'title') {
                const databaseProps = Object.values(database.properties);
                const titleProp = databaseProps.find(
                    (prop) => prop.type === 'title',
                );
                props[propName] = {
                    id: titleProp.id,
                    name: propName,
                    type: 'title',
                };
                continue;
            }

            if (database.properties[propName]) {
                props[propName] = database.properties[propName];
            }
        }

        return props;
    }

    private checkPropsValid(props: NotionProps) {
        const propsCheckRes = {
            title: this.propCheck(props, 'title'),
            calendar: this.propCheck(props, 'calendar'),
            date: this.propCheck(props, 'date'),
            delete: this.propCheck(props, 'delete'),
        };

        const isValid = Object.values(propsCheckRes).every(
            (e) => e.exist && e.type,
        );

        return {
            isValid,
            props: propsCheckRes,
        };
    }

    private propCheck = (props: NotionProps, name: string) => {
        const prop = props[name];

        if (!prop) {
            return {
                exist: false,
                type: false,
            };
        }

        if (prop.type !== propsTypes[name]) {
            return {
                exist: true,
                type: false,
            };
        }

        return {
            exist: true,
            type: true,
        };
    };
}
