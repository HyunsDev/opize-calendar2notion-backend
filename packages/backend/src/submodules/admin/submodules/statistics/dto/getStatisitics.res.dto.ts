export class GetStatisticsResDto {
    user: {
        all: number;
        plan: {
            free: number;
            pro: number;
            sponsor: number;
        };
        connect: {
            connected: number;
            disconnected: number;
        };
    };
    calendar: number;
    money: number;
}
