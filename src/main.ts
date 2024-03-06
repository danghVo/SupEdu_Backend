import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './interceptor/response.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // elimating unwanted fields
        }),
    );
    await app.listen(3000);
}
bootstrap();
