import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guard/auth.guard';

@Module({
    imports: [JwtModule.register({})],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: 'APP_GUARD',
            useClass: AuthGuard,
        },
    ],
})
export class AuthModule {}
