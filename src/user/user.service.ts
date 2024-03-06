import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDto, PasswordChagneDto } from './dto';

import * as argon2 from 'argon2';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async profile(uuid: string) {
        const user = await this.prisma.user.findUnique({
            where: { uuid },
        });

        delete user.password;
        delete user.refreshToken;

        return user;
    }

    async updateProfile(uuid: string, profileDto: ProfileDto) {
        try {
            const updatedProfile = await this.prisma.user.update({
                where: { uuid },
                data: {
                    name: profileDto.name,
                },
            });

            return updatedProfile;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error('Người dùng không tồn tại');
                }
            } else throw new Error('Lỗi không xác định');
        }
    }

    async changePassword(uuid: string, passwordChagneDto: PasswordChagneDto) {
        const updatedUser = await this.prisma.user.findUniqueOrThrow({
            where: { uuid },
        });

        const verify = await argon2.verify(updatedUser.password, passwordChagneDto.oldPassword);

        if (!verify) {
            throw new ForbiddenException('Mật khẩu cũ không đúng');
        }

        try {
            const hashNewpassword = await argon2.hash(passwordChagneDto.newPassword);

            await this.prisma.user.update({
                where: { uuid },
                data: {
                    password: hashNewpassword,
                },
            });

            return { message: 'Mật khẩu đã được thay đổi' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new Error('Người dùng không tồn tại');
                }
            } else throw new Error('Lỗi không xác định');
        }
    }
}
