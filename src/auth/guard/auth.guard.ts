import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, response } from 'express';
import { Public } from '../decorator/public.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private config: ConfigService,
        private jwt: JwtService,
        private auth: AuthService,
    ) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        const isPublic = this.reflector.get<boolean>(Public, context.getHandler());

        if (isPublic) {
            return true;
        }

        if (!token) {
            throw new UnauthorizedException('Unauthorized');
        }

        try {
            const secret = this.config.get('JWT_SECRET_KEY');

            const payload = await this.jwt.verifyAsync(token, { secret });

            request['user'] = payload;
        } catch (error) {
            if (error.message === 'jwt expired') {
                const payload = this.jwt.decode(token);
                const newAccessToken = await this.tryToRefreshToken(payload.uuid);

                const response = context.switchToHttp().getResponse();
                response['accessToken'] = newAccessToken;

                delete payload.iat;
                delete payload.exp;

                request['user'] = payload;
                return true;
            } else throw new UnauthorizedException('Unauthorized');
        }

        return true;
    }

    async tryToRefreshToken(uuid: string) {
        try {
            const accessToken = await this.auth.refreshAccessToken(uuid);

            if (!accessToken) {
                throw new UnauthorizedException('Unauthorized');
            }
            return accessToken;
        } catch (error) {
            throw new UnauthorizedException('Unauthorized');
        }
    }

    extractTokenFromHeader(request: Request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];

        return token;
    }
}
