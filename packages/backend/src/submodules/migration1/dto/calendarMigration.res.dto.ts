interface calendarMigrateSuccessResDto {
    success: true;
}
interface calendarMigrateFailResDto {
    success: false;
}
export type calendarMigrateResDto =
    | calendarMigrateSuccessResDto
    | calendarMigrateFailResDto;
