import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsString } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
    Provision = 'provision',
}

export class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    PORT: number;

    // Database
    @IsString()
    DB_USERNAME: string;

    @IsString()
    DB_PASSWORD: string;

    @IsString()
    DB_DATABASE: string;

    @IsString()
    DB_HOST: string;

    @IsNumber()
    DB_PORT: number;

    @IsString()
    DB_SYNCHRONIZE: string;

    // Opize
    @IsString()
    OPIZE_API_SERVER: string;

    @IsString()
    OPIZE_PROJECT_CODE: string;

    @IsString()
    OPIZE_PROJECT_SECRET_TOKEN: string;

    @IsString()
    OPIZE_REDIRECT_URL: string;

    // Auth
    @IsString()
    JWT_SECRET: string;

    // Notion
    @IsString()
    NOTION_CLIENT_ID: string;

    @IsString()
    NOTION_CLIENT_SECRET: string;

    @IsString()
    NOTION_CALLBACK: string;

    // Google
    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsString()
    GOOGLE_CLIENT_PASSWORD: string;

    @IsString()
    GOOGLE_CALLBACK: string;

    @IsString()
    GOOGLE_CALLBACK_VERSION: string;

    @IsObject()
    @Transform(({ value }) => JSON.parse(value))
    GOOGLE_CALLBACKS: {
        [key: string]: string;
    };

    // Migration DB
    @IsString()
    MIGRATION_DB_HOST: string;

    @IsString()
    MIGRATION_DB_PORT: string;

    @IsString()
    MIGRATION_DB_USERNAME: string;

    @IsString()
    MIGRATION_DB_PASSWORD: string;

    @IsString()
    MIGRATION_DB_DATABASE: string;

    // Discord Webhook
    @IsString()
    DISCORD_WEBHOOK_BACKEND_ERROR_URL: string;
}
