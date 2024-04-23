import { Body, Controller, Get, Patch, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { ProfileDto, PasswordChagneDto } from './dto';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
    constructor(private user: UserService) {}

    @Get('profile')
    async profile(@Req() req: Request & { user: { uuid: string } }) {
        const uuid = req.user.uuid;

        const profile = await this.user.profile(uuid);

        delete profile.password;

        return profile;
    }

    @Get('uuid')
    async getUuid(@Query() query: { email: string }) {
        const uuid = await this.user.getUuid(query.email);

        return uuid;
    }

    @Put('changePassword')
    async changePassword(
        @Body() passwordChagneDto: PasswordChagneDto,
        @Req() req: Request & { user: { uuid: string } },
    ) {
        const updatedUser = await this.user.changePassword(req.user.uuid, passwordChagneDto);

        return updatedUser;
    }

    @UseInterceptors(FileInterceptor('file'))
    @Patch('updateProfile')
    async updateProfile(
        @Body() profileDto: ProfileDto,
        @Req() req: Request & { user: { uuid: string } },
        @UploadedFile() avatar: Express.Multer.File,
    ) {
        const profile = await this.user.updateProfile(req.user.uuid, profileDto, avatar);

        return profile;
    }
}
