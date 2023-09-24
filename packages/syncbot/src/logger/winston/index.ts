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
            new winstonDaily({
                level: 'info',
                datePattern: 'YYYY-MM-DD',
                dirname: logDir,
                filename: `%DATE%.log`,
                maxFiles: 30,
                zippedArchive: true,
            }),
            new winstonDaily({
                level: 'error',
                datePattern: 'YYYY-MM-DD',
                dirname: logDir + '/error',
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
                    winston.format.colorize(),
                    winston.format.simple(),
                ),
            }),
        );
    }

    return logger;
};

export const runnerLogger = loggerGenerator('runner');
export const serverLogger = loggerGenerator('server');
export const workerLogger = loggerGenerator('worker');
