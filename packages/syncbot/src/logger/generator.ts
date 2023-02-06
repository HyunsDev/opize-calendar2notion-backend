import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
const { combine, timestamp, printf } = winston.format;

const logFormat = printf(
    ({
        timestamp,
        level,
        message,
    }: {
        timestamp: string;
        level: string;
        message: string;
    }) => {
        return `${timestamp} ${level}: ${message}`;
    },
);

export const loggerGenerator = (name: string) => {
    const logDir = `logs/${name}`;
    const logger = winston.createLogger({
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            logFormat,
        ),
        transports: [
            // info 레벨 로그를 저장할 파일 설정
            new winstonDaily({
                level: 'info',
                datePattern: 'YYYY-MM-DD',
                dirname: logDir,
                filename: `%DATE%.log`,
                maxFiles: 30, // 30일치 로그 파일 저장
                zippedArchive: true,
            }),
            // error 레벨 로그를 저장할 파일 설정
            new winstonDaily({
                level: 'error',
                datePattern: 'YYYY-MM-DD',
                dirname: logDir + '/error', // error.log 파일은 /logs/error 하위에 저장
                filename: `%DATE%.error.log`,
                maxFiles: 30,
                zippedArchive: true,
            }),
        ],
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(), // 색깔 넣어서 출력
                    winston.format.simple(), // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
                ),
            }),
        );
    }

    return logger;
};
