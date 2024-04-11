import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './interceptor/response.interceptor';
import { AllExceptionFilter } from './exception/AllExceptionFilter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(new ResponseInterceptor());
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionFilter(httpAdapterHost));
    app.enableCors();
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // elimating unwanted fields
        }),
    );
    await app.listen(4000);
}
bootstrap();
