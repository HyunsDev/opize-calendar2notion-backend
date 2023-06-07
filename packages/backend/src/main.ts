import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { GlobalExceptionFilter } from './app.exceptionFilter';

dotenv.config({
    path: path.resolve(
        process.env.NODE_ENV === 'production' ? '.production.env' : '.env',
    ),
});

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.listen(process.env.PORT || 3003);
}
bootstrap();
