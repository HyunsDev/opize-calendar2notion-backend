import { NotFoundException } from '@nestjs/common';
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { UserEntity } from '@opize/calendar2notion-model';
import { NotionClient } from 'src/common/api-client/notion.client';
import { Migration1UserEntity } from './entity/migration1.user.entity';
import { Migration1StreamHelper } from './migration1.stream.helper';

type PropName =
    | 'title'
    | 'calendar'
    | 'date'
    | 'delete'
    | 'calendar'
    | 'location'
    | 'description';
type Prop = {
    name: PropName;
    id: string;
    type: 'title' | 'rich_text' | 'number' | 'select' | 'multi_select';
};
type Props = Partial<Record<PropName, Prop>>;

function hasDuplicates(array: any[]) {
    const set: any = new Set(array);
    return set.size !== array.length;
}

export class NotionMigrate1Util {
    private client: NotionClient;
    user: UserEntity;
    migrateUser: Migration1UserEntity;
    database: GetDatabaseResponse;

    constructor(user: UserEntity, migrateUser: Migration1UserEntity) {
        this.client = new NotionClient(user.notionAccessToken);
        this.user = user;
        this.migrateUser = migrateUser;
    }

    /**
     * 노션 데이터베이스 프로퍼티를 마이그레이션합니다.
     */
    public async propsMigrate() {
        await this.getDatabase();

        await this.createMissingProps();

        const propsValid = this.checkPropsValid();
        if (!propsValid.isValid) {
            return {
                success: false,
                message: '노션 데이터베이스 속성이 올바르지 않습니다',
                code: 'NOTION_DATABASE_INVALID_PROPERTIES',
                details: propsValid.props,
            };
        }

        const calendarPropValid = this.checkCalendarPropValid();
        if (!calendarPropValid.isValid) {
            return {
                success: false,
                message:
                    '노션 데이터베이스 캘린더 속성 올바르게 설정되지 않았습니다.',
                code: 'NOTION_DATABASE_INVALID_CALENDAR',
                details: calendarPropValid.incorrectOptionNames,
            };
        }

        const sameNameCalendarValid = this.checkSameNameCalendar();
        if (!sameNameCalendarValid.isValid) {
            return {
                success: false,
                message: '캘린더 이름이 중복되었습니다.',
                code: 'DUPLICATED_CALENDAR_NAME',
                details: sameNameCalendarValid.duplicateNames,
            };
        }

        const props = this.getPropsIds();
        return {
            success: true,
            props,
        };
    }

    private async getDatabase() {
        const database = await this.client.getDatabase(
            this.migrateUser.notionDatabaseId,
        );

        if (!database) {
            throw new NotFoundException({
                code: 'NOTION_DATABASE_NOT_FOUND',
                message: '노션 데이터베이스를 찾을 수 없습니다.',
            });
        }

        this.database = database;
        return database;
    }

    private async createMissingProps() {
        const propsIds = this.getPropsIds();

        if (!propsIds.location) {
            await this.client.addProperty(
                this.database.id,
                'location',
                'rich_text',
            );
        }

        if (!propsIds.description) {
            await this.client.addProperty(
                this.database.id,
                'description',
                'rich_text',
            );
        }

        await this.getDatabase();
    }

    private getProps(): Props {
        const propsNames = [
            'title',
            'calendar',
            'date',
            'delete',
            'location',
            'description',
        ];

        const props: Props = {};
        propsNames.forEach((e) => {
            if (this.database.properties[e]) {
                props[e] = this.database.properties[e];
            }
        });
        return props;
    }

    private getPropsIds(): Partial<Record<PropName, string>> {
        const propsIds: Partial<Record<PropName, string>> = {};
        Object.values(this.getProps()).forEach(
            (prop) => (propsIds[prop.name] = prop.id),
        );
        return propsIds;
    }

    private checkPropsValid() {
        const props = this.getProps();

        const propsTypes = {
            title: 'title',
            calendar: 'select',
            date: 'date',
            delete: 'checkbox',
            location: 'rich_text',
            description: 'rich_text',
        };

        const propCheck = (name: string) => {
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

        const propsCheck = {
            title: propCheck('title'),
            calendar: propCheck('calendar'),
            date: propCheck('date'),
            delete: propCheck('delete'),
            location: propCheck('location'),
            description: propCheck('description'),
        };

        const isValid = Object.values(propsCheck).every(
            (e) => e.exist && e.type,
        );

        return {
            isValid,
            props: propsCheck,
        };
    }

    private checkCalendarPropValid() {
        const calendarProp = this.getProp('calendar');
        if (calendarProp.type !== 'select') {
            return;
        }

        const optionNames = calendarProp.select.options.map((e) => e.name);
        const correctOptionNames = this.migrateUser.calendars.map(
            (e) => e.googleCalendarName,
        );
        const diff = correctOptionNames.filter((e) => !optionNames.includes(e));

        if (diff.length === 0) {
            return {
                isValid: true,
            };
        } else {
            return {
                isValid: false,
                incorrectOptionNames: diff,
            };
        }
    }

    private checkSameNameCalendar() {
        const calendarProp = this.getProp('calendar');
        if (calendarProp.type !== 'select') {
            return;
        }

        const optionNames = calendarProp.select.options.map((e) => e.name);
        const hasDuplicate = hasDuplicates(optionNames);
        if (hasDuplicate) {
            return {
                isValid: false,
                duplicateNames: optionNames,
            };
        } else {
            return {
                isValid: true,
            };
        }
    }

    private getProp(propName: string) {
        const prop = this.database.properties[propName];
        return prop;
    }
}
