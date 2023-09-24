interface accountMigrateSuccessResDto {
    success: true;
    canCalendarMigration: boolean;
    userPlan: string;
    paymentLogLength: number;
}
interface accountMigrateFailResDto {
    success: false;
    reason: 'USER_NOT_FOUND' | 'ALREADY_MIGRATED';
}
export type accountMigrateResDto =
    | accountMigrateSuccessResDto
    | accountMigrateFailResDto;
