import { response } from 'express';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

export interface Response<T> {
    data: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<any, Response<any>> {
    intercept(context: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            map((data) => {
                if (data?.password) delete data.password;
                if (data?.refreshToken) delete data.refreshToken;

                return {
                    data,
                };
            }),
        );
    }
}
