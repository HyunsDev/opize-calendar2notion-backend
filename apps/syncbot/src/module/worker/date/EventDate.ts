import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(timezone);

type DateOrDateTime =
    | {
          date: string;
          timeZone?: string;
      }
    | {
          dateTime: string;
          timeZone?: string;
      };

export type GCalDateTime = {
    start: {
        date?: string | null;
        dateTime?: string | null;
    };
    end: {
        date?: string | null;
        dateTime?: string | null;
    };
    timeZone?: string;
};

export type NotionDateTime = {
    start: string;
    end?: string;
};

export class EventDate {
    start: DateOrDateTime;
    end?: DateOrDateTime;
    timeZone?: string;

    static fromGCalDate({ start, end, timeZone }: GCalDateTime) {
        const eventDate = new EventDate();
        eventDate.start = start as DateOrDateTime;
        eventDate.end = end as DateOrDateTime;
        eventDate.timeZone = timeZone;
        return eventDate;
    }

    static fromNotionDate({ start, end }: NotionDateTime) {
        const eventDate = new EventDate();
        if (start.length === 10) {
            eventDate.start = {
                date: start,
            };
        } else {
            eventDate.start = {
                dateTime: start,
            };
        }

        if (end) {
            if (end.length === 10) {
                eventDate.end = {
                    date: end,
                };
            } else {
                eventDate.end = {
                    dateTime: end,
                };
            }
        }
        return eventDate;
    }

    toGCalDate(): GCalDateTime {
        if ('date' in this.start) {
            return {
                start: {
                    date: this.start.date,
                    dateTime: null,
                },
                end: {
                    date:
                        this.end && 'date' in this.end
                            ? dayjs(this.end.date)
                                  .add(1, 'day')
                                  .format('YYYY-MM-DD')
                            : this.start.date,
                    dateTime: null,
                },
            };
        } else if ('dateTime' in this.start) {
            return {
                start: {
                    dateTime: dayjs(this.start.dateTime).format(
                        'YYYY-MM-DDTHH:mm:ssZ',
                    ),
                    date: null,
                },
                end: {
                    dateTime: dayjs(
                        this.end && 'dateTime' in this.end
                            ? this.end.dateTime
                            : this.start.dateTime,
                    ).format('YYYY-MM-DDTHH:mm:ssZ'),
                    date: null,
                },
            };
        }

        throw new Error('Invalid date');
    }

    toNotionDate(): NotionDateTime {
        const date = {
            start: 'date' in this.start ? this.start.date : this.start.dateTime,
            end: '',
        };

        const start =
            'date' in this.start ? this.start.date : this.start.dateTime;

        if ('date' in this.start && 'date' in this.end) {
            date.end =
                this.end.date === this.start.date
                    ? this.end.date
                    : dayjs(this.end.date).toISOString().split('T')[0];
        } else if ('dateTime' in this.start && 'dateTime' in this.end) {
            date.end = this.end.dateTime;
        } else {
            throw new Error('Invalid date');
        }

        if (start != date.end) {
            return {
                start: date.start,
                end: date.end,
            };
        } else {
            return {
                start: date.start,
            };
        }
    }
}
