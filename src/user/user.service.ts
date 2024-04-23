import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDto, PasswordChagneDto } from './dto';

import * as argon2 from 'argon2';
import * as moment from 'moment';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private aws: AwsService,
    ) {}

    async profile(uuid: string) {
        const user = await this.prisma.user.findUnique({
            where: { uuid },
        });

        if (user.avatar) {
            user.avatar = await this.aws.getImage(user.avatar);
        }

        delete user.password;
        delete user.refreshToken;
        delete user.isVerify;
        delete user.verifyToken;
        delete user.updatedAt;

        return {
            ...user,
            createAt: moment(user.createAt).format('DD-MM-YYYY'),
        };
    }

    async getUuid(email: string) {
        try {
            const user = await this.prisma.user.findUniqueOrThrow({
                where: { email },
            });

            return user.uuid;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error('Người dùng không tồn tại');
                }
            } else throw new Error('Lỗi không xác định');
        }
    }

    async updateProfile(uuid: string, profileDto: ProfileDto, avatar: Express.Multer.File) {
        try {
            let avatarKey = undefined;

            if (avatar) {
                avatarKey = await this.aws.uploadAvatar(uuid, avatar);
            }

            const updatedProfile = await this.prisma.user.update({
                where: { uuid },
                data: {
                    name: profileDto.name,
                    age: parseInt(profileDto.age),
                    avatar: avatarKey,
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

        if (passwordChagneDto.newPassword !== passwordChagneDto.confirmPassword)
            throw new ForbiddenException('Mật khẩu xác nhận không khớp');

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
                    throw new ForbiddenException('Người dùng không tồn tại');
                }
            } else throw new Error('Lỗi không xác định');
        }
    }
}
