import { Body, Controller, Get, Param, Patch, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { ProfileDto, PasswordChagneDto } from './dto';

@Controller('user')
export class UserController {
    constructor(private user: UserService) {}

    @Get('profile')
    async profile(@Request() req: any) {
        const uuid = req.user.uuid;

        const profile = await this.user.profile(uuid);

        delete profile.password;

        return profile;
    }

    @Patch('password/change/:uuid')
    async changePassword(@Body() passwordChagneDto: PasswordChagneDto, @Param('uuid') uuid: string) {
        const updatedUser = await this.user.changePassword(uuid, passwordChagneDto);

        return updatedUser;
    }

    @Patch('profile/update/:uuid')
    async updateProfile(@Body() profileDto: ProfileDto, @Param('uuid') uuid: string) {
        const profile = await this.user.updateProfile(uuid, profileDto);

        return profile;
    }
}
