import { Transform } from 'class-transformer';
import { IsEnum, IsObject, IsString } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
    Provision = 'provision',
}

export class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    // SyncBot
    @IsString()
    SYNCBOT_PREFIX: string;

    // Database
    @IsString()
    DB_USERNAME: string;

    @IsString()
    DB_PASSWORD: string;

    @IsString()
    DB_DATABASE: string;

    @IsString()
    DB_HOST: string;

    @IsString()
    DB_PORT: string;

    @IsString()
    DB_SYNCHRONIZE: string;

    // Notion
    @IsString()
    NOTION_CLIENT_ID: string;

    @IsString()
    NOTION_CLIENT_SECRET: string;

    // Google
    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsString()
    GOOGLE_CLIENT_PASSWORD: string;

    @IsString()
    GOOGLE_CALLBACK: string;

    @IsObject()
    @Transform(({ value }) => JSON.parse(value))
    GOOGLE_CALLBACKS: {
        [key: string]: string;
    };

    // Date
    @IsString()
    MIN_DATE: string;

    @IsString()
    MAX_DATE: string;

    @IsString()
    SERVICE_START_DATE: string;

    // Control Server
    @IsString()
    SYNCBOT_CONTROL_SECRET: string;

    @IsString()
    PORT: string;

    // Backend
    @IsString()
    SYNCBOT_BACKEND: string;
}
