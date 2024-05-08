import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto, SignUpDto } from './dto';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { randomBytes, randomInt } from 'crypto';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private mailService: MailService,
        private socket: SocketGateway,
    ) {}

    async signToken(payload: { uuid: String; email: String; role: String }, secret: string, expiresIn: string = '60s') {
        return await this.jwt.signAsync(payload, { secret, expiresIn: expiresIn });
    }

    async refreshAccessToken(uuid: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { uuid },
                select: { refreshToken: true },
            });

            if (!user.refreshToken) {
                throw new UnauthorizedException('Unauthorized');
            }

            const payload = await this.jwt.verifyAsync(user.refreshToken, {
                secret: this.config.get('JWT_SECRET_KEY_REFRESH'),
            });

            delete payload.iat;
            delete payload.exp;

            const secret = this.config.get('JWT_SECRET_KEY');

            const accessToken = await this.signToken(payload, secret);

            return accessToken;
        } catch (error) {
            throw new UnauthorizedException('Unauthorized');
        }
    }

    async setRefreshToken(uuid: string, refreshToken: string) {
        await this.prisma.user.update({
            where: { uuid: uuid },
            data: {
                refreshToken,
            },
        });
    }

    async signUp(signUpDto: SignUpDto) {
        const isUserExisted = await this.prisma.user.findUnique({
            where: { email: signUpDto.email },
        });

        if (isUserExisted) {
            throw new ForbiddenException('Email đã được đăng ký');
        }

        try {
            if (signUpDto.password !== signUpDto.confirmPassword) {
                throw new ForbiddenException('Mật khẩu không khớp');
            }

            // hash password
            const hashPassword = await argon2.hash(signUpDto.password);

            const verifyToken = randomBytes(64).toString('hex');

            // create user
            const newUser = await this.prisma.user.create({
                data: {
                    email: signUpDto.email,
                    password: hashPassword,
                    name: signUpDto.name,
                    role: signUpDto.role,
                    age: signUpDto.age,
                    verifyToken,
                },
            });

            this.deleteUnverifyUser(newUser.uuid);

            await this.mailService.mailConfirm(signUpDto.email, newUser.uuid, verifyToken);

            return { uuid: newUser.uuid };
        } catch (error) {
            console.log(error);
            throw new ForbiddenException('Có lỗi xảy ra, vui lòng thử lại sau');
        }
    }

    async deleteUnverifyUser(uuid: string) {
        return new Promise((resolve, reject) => {
            console.time();
            setTimeout(
                async () => {
                    console.timeEnd();
                    console.log('delete user');
                    const user = await this.prisma.user.findFirst({
                        where: { isVerify: false, uuid },
                    });

                    if (!user?.isVerify) {
                        await this.prisma.user.delete({
                            where: { uuid },
                        });
                    }
                },
                5 * 60 * 1000,
            );
        });
    }

    async signIn(signInDto: SignInDto) {
        try {
            // checking if user exists
            const userExisted = await this.prisma.user.findUniqueOrThrow({
                where: { email: signInDto.email },
            });

            if (!userExisted.isVerify) {
                throw new ForbiddenException('Hãy xác nhận email của bạn');
            }

            // hash password
            const passwordChecking = await argon2.verify(userExisted.password, signInDto.password);
            if (!passwordChecking) {
                throw new ForbiddenException('Mật khẩu không đúng');
            }

            delete userExisted.password;

            const payload = {
                uuid: userExisted.uuid,
                email: userExisted.email,
                role: userExisted.role,
            };

            const secret = this.config.get('JWT_SECRET_KEY');
            const secretRefesh = this.config.get('JWT_SECRET_KEY_REFRESH');
            const access_token = await this.signToken(payload, secret);
            const refresh_token = await this.signToken(payload, secretRefesh, '1d');

            await this.setRefreshToken(userExisted.uuid, refresh_token);

            return { access_token };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new ForbiddenException('Email không tồn tại');
                }
            } else throw new ForbiddenException(error.message);
        }
    }

    async logOut(uuid: string) {
        try {
            await this.prisma.user.update({
                where: { uuid: uuid },
                data: {
                    refreshToken: null,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new Error('Người dùng không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }

    async verifyMail(userUuid: string, token: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { uuid: userUuid },
                select: { verifyToken: true },
            });

            if (user.verifyToken !== token) {
                throw new ForbiddenException('Token đã hết hạn hoặc không đúng');
            }

            await this.prisma.user.update({
                where: { uuid: userUuid },
                data: { isVerify: true, verifyToken: null },
            });

            this.socket.server.emit('verify', { status: 'success', message: 'Xác nhận thành công' });

            return true;
        } catch (error) {
            return false;
        }
    }

    async resendVerifyMail(uuid: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { uuid },
                select: { email: true },
            });

            const verifyToken = randomBytes(64).toString('hex');
            await this.prisma.user.update({
                where: { uuid },
                data: { verifyToken },
            });

            await this.mailService.mailConfirm(user.email, uuid, verifyToken);
            return { message: 'Đã gửi lại mail xác nhận' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new Error('Người dùng không tồn tại');
                }
            } else throw new ForbiddenException('Lỗi không xác định');
        }
    }
}
