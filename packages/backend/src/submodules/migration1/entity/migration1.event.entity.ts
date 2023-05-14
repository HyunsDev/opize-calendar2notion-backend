export type Migration1EventEntity = {
    id: number;
    googleCalendarEventId: string;
    notionPageId: string;
    gcalCalendar: string;
    lastNotionUpdate: string;
    lastGoogleUpdate: string;
    willRemove: 0 | 1;
    createdAt: string;
    updatedAt: string;
    userId: number;
};
