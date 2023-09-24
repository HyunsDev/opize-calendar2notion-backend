import {
    ProtoEvent,
    ProtoEventConstructorProps,
} from '../ProtoEvent/ProtoEvent';

import { EventDateTime } from './EventDateTime.type';

export interface EventConstructorProps extends ProtoEventConstructorProps {
    title: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    location?: string;
    description?: string;
    date: EventDateTime;
    googleCalendarEventLink?: string;
}

/**
 * Calendar2notion에서 캘린더 간 이벤트를 전달하기 위한 DTO
 */
export class EventDto extends ProtoEvent {
    // data
    title: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    location?: string;
    description?: string;
    date: EventDateTime;
    googleCalendarEventLink?: string;

    constructor(data: EventConstructorProps) {
        super(data);
        this.title = data.title;
        this.status = data.status;
        this.location = data.location;
        this.description = data.description;
        this.date = data.date;
        this.googleCalendarEventLink = data.googleCalendarEventLink;
    }

    /**
     * 인자로 받은 Event와 병합하여 새로운 Event를 반환합니다.
     * 값이 다른 속성이 있을 경우 인자로 받은 Event의 값으로 덮어씁니다.
     */
    merge(event: EventDto): EventDto {
        const mergedEvent = new EventDto(Object.assign({}, this, event));
        return mergedEvent;
    }
}
