import { Body, Controller, Get, Param, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';
import { Public } from './decorator/public.decorator';
import { Response } from 'express';
import { success, fail } from './html';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post('/signup')
    async signUp(@Body() dto: SignUpDto) {
        const result = await this.authService.signUp(dto);
        return result;
    }

    @Public()
    @Post('/signin')
    async signIn(@Body() dto: SignInDto) {
        const accessToken = await this.authService.signIn(dto);

        return accessToken;
    }

    @Public()
    @Post('/logout/:uuid')
    async logout(@Param('uuid') uuid: string) {
        await this.authService.logOut(uuid);

        return { message: 'Đăng xuất thành công' };
    }

    @Public()
    @Get('verify/:userUuid/:token')
    async verifyMail(@Res() res: Response, @Param('token') token: any, @Param('userUuid') userUuid: any) {
        const status = await this.authService.verifyMail(userUuid, token);

        if (status) {
            return res.send(success());
        } else res.send(fail());
    }

    @Public()
    @Get('resend-verify-mail/:uuid')
    async resendVerifyMail(@Param('uuid') uuid: string) {
        const data = await this.authService.resendVerifyMail(uuid);

        return data;
    }
}
