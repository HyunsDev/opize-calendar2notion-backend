import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

export type EventDateTime = {
    start: {
        date?: string;
        dateTime?: string;
    };
    end?: {
        date?: string;
        dateTime?: string;
    };
    timeZone?: string;
};

export type GCalDateTime = {
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    timeZone?: string;
};

export type NotionDateTime = {
    start: string;
    end?: string;
};

export const transDate = {
    notionToEvent: ({ start, end }: NotionDateTime): EventDateTime => {
        const eventDate: EventDateTime = {
            start: {},
        };

        if (start.length === 10) {
            eventDate.start.date = start;
        } else {
            eventDate.start.dateTime = start;
        }

        if (end) {
            eventDate.end = {};
            if (end.length === 10) {
                eventDate.end.date = end;
            } else {
                eventDate.end.dateTime = end;
            }
        }
        return eventDate;
    },
    gCalToEvent: ({ start, end, timeZone }: GCalDateTime): EventDateTime => {
        const eventDate: EventDateTime = {
            start: start,
            end: end,
            timeZone,
        };

        return eventDate;
    },
    eventToGcal: ({ start, end }: EventDateTime): GCalDateTime => {
        console.log(start, end);

        if (start.date) {
            // Date 일 경우
            console.log({
                start: {
                    date: start.date,
                },
                end: {
                    date: end?.date
                        ? dayjs(end.date).add(1, 'day').format('YYYY-MM-DD')
                        : start.date,
                },
            });
            return {
                start: {
                    date: start.date,
                },
                end: {
                    date: end?.date
                        ? dayjs(end.date).add(1, 'day').format('YYYY-MM-DD')
                        : start.date,
                },
            };
        } else {
            // DateTime 일 경우
            console.log({
                start: {
                    dateTime: dayjs(start.dateTime).format(
                        'YYYY-MM-DDTHH:mm:ssZ',
                    ),
                    date: null,
                },
                end: {
                    dateTime: dayjs(end?.dateTime || start.dateTime).format(
                        'YYYY-MM-DDTHH:mm:ssZ',
                    ),
                    date: null,
                },
            });
            return {
                start: {
                    dateTime: dayjs(start.dateTime).format(
                        'YYYY-MM-DDTHH:mm:ssZ',
                    ),
                    date: null,
                },
                end: {
                    dateTime: dayjs(end?.dateTime || start.dateTime).format(
                        'YYYY-MM-DDTHH:mm:ssZ',
                    ),
                    date: null,
                },
            };
        }
    },
    eventToNotion: ({ start, end }: EventDateTime): NotionDateTime => {
        const _start = (start.date || start.dateTime) as string;
        let _end: string;

        if (end?.date) {
            _end =
                end.date === start.date
                    ? end.date
                    : dayjs(end.date).toISOString().split('T')[0];
        } else {
            _end = end?.dateTime as string;
        }

        if ((start.date || start.dateTime) !== _end) {
            return {
                start: _start,
                end: _end,
            };
        } else {
            return {
                start: _start,
            };
        }
    },
};
