import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';
import { Public } from './decorator/public.decorator';

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
}
