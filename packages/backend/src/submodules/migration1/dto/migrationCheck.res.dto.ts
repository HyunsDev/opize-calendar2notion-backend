export type MigrationCheckFalseResDto = {
    canMigrate: false;
    reason: 'USER_NOT_FOUND';
};
export type MigrationCheckTrueResDto = {
    canMigrate: true;
    user: {
        id: number;
        imageUrl: string;
        email: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        status: string;
        userPlan: string;
        calendars: {
            id: number;
            googleCalendarId: string;
            googleCalendarName: string;
            accessRole: string;
        }[];
    };
};
export type MigrationCheckResDto =
    | MigrationCheckFalseResDto
    | MigrationCheckTrueResDto;
