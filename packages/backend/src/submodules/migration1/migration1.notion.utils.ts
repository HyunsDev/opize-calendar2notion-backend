import { HttpStatus } from '@nestjs/common';
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { UserEntity } from '@opize/calendar2notion-model';
import { NotionClient } from 'src/common/api-client/notion.client';
import { Migration1UserEntity } from './entity/migration1.user.entity';
import { Migration1Error } from './error/migration.error';

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
    [key: string]: any;
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
        const notionAccessToken =
            user.notionWorkspace.accessToken || user.notionAccessToken;

        this.client = new NotionClient(notionAccessToken);
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
            throw new Migration1Error(
                'NOTION_DATABASE_INVALID_PROPERTIES',
                '노션 데이터베이스 속성이 올바르지 않아요.',
                `속성을 올바르게 바꿔주세요. (${propsValid.errorMessage})`,
                HttpStatus.BAD_REQUEST,
                propsValid.props,
            );
        }

        const calendarPropValid = this.checkCalendarPropValid();
        if (!calendarPropValid.isValid) {
            const guideMessage = calendarPropValid.changedOptionNamesGuide
                .map(
                    (e) =>
                        `'${e.originalName}'을 '${e.changedName}'로 변경해주세요.`,
                )
                .join('\n');
            throw new Migration1Error(
                'NOTION_DATABASE_INVALID_CALENDAR',
                '노션 데이터베이스 캘린더 속성이 올바르지 않아요.',
                `노션 데이터베이스의 calendar 속성의 옵션들을 바꿔주세요.\n\n${guideMessage}\n\n만약 노션에 위 옵션이 없다면, 새로 추가해주세요.`,
                HttpStatus.BAD_REQUEST,
                calendarPropValid.incorrectOptionNames,
                'zR8sZnkXo-E',
            );
        }

        const sameNameCalendarValid = this.checkSameNameCalendar();
        if (!sameNameCalendarValid.isValid) {
            throw new Migration1Error(
                'DUPLICATED_CALENDAR_NAME',
                '캘린더 이름이 중복되었어요.',
                '동일한 이름의 캘린더가 있어요. 캘린더 이름은 중복될 수 없어요. 오른쪽 아래 버튼을 통해 개발자에게 문의해주세요.',
                HttpStatus.BAD_REQUEST,
                sameNameCalendarValid.duplicateNames,
            );
        }
        return {
            success: true,
        };
    }

    getPropIds(): Partial<Record<PropName, string>> {
        const propsIds: Partial<Record<PropName, string>> = {};
        Object.values(this.getProps()).forEach(
            (prop) => (propsIds[prop.name] = prop.id),
        );
        return propsIds;
    }

    getCalendarPropOptions(): { id: string; name: string; color: string }[] {
        const calendarProp = this.getProps().calendar;
        return calendarProp.type === 'select'
            ? calendarProp.select.options
            : undefined;
    }

    private async getDatabase() {
        const database = await this.client.getDatabase(
            this.migrateUser.notionDatabaseId,
        );

        if (!database) {
            throw new Migration1Error(
                'NOTION_DATABASE_NOT_FOUND',
                '노션 데이터베이스를 찾을 수 없어요',
                'Opize Calendar2notion (또는 C2N TEST v4 Public) 연결과 Calendar2notion - Opize 연결이 모두 있는지 확인해주세요!',
                HttpStatus.NOT_FOUND,
                '',
                'J8bJLFu_2eQ',
            );
        }

        this.database = database;
        return database;
    }

    private async createMissingProps() {
        const propsIds = this.getPropIds();

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

        const propsTypesKorean = {
            title: '제목',
            select: '선택',
            date: '날짜',
            checkbox: '체크박스',
            rich_text: '텍스트',
        };

        const errorMessages = [];
        for (const prop in propsCheck) {
            if (!propsCheck[prop].exist) {
                errorMessages.push(
                    `${prop} 속성을 '${
                        propsTypesKorean[propsTypes[prop]]
                    }' 타입으로 만들어주세요.`,
                );
            } else if (!propsCheck[prop].type) {
                errorMessages.push(
                    `${prop} 속성의 타입을 '${
                        propsTypesKorean[propsTypes[prop]]
                    }'로 바꿔주세요.`,
                );
            }
        }

        return {
            isValid,
            props: propsCheck,
            errorMessage: errorMessages.join(' '),
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
        const changedOptionNamesGuide = this.migrateUser.calendars
            .filter((e) => !optionNames.includes(e.googleCalendarName))
            .map((e) => ({
                originalName:
                    e.googleCalendarId === this.migrateUser.email
                        ? `My Calendar | ${e.googleCalendarId.substring(
                              0,
                              5,
                          )}...`
                        : `${
                              e.googleCalendarName
                          } | ${e.googleCalendarId.substring(0, 5)}...`,
                changedName: e.googleCalendarName,
            }));

        if (diff.length === 0) {
            return {
                isValid: true,
            };
        } else {
            return {
                isValid: false,
                incorrectOptionNames: diff,
                changedOptionNamesGuide: changedOptionNamesGuide,
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
