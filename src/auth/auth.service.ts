import { ForbiddenException, Injectable, Response, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto, SignUpDto } from './dto';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
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
        try {
            // hash password
            const hashPassword = await argon2.hash(signUpDto.password);

            // create user
            const newUser = await this.prisma.user.create({
                data: {
                    email: signUpDto.email,
                    password: hashPassword,
                    name: signUpDto.name,
                    role: signUpDto.role,
                    age: signUpDto.age,
                },
            });

            delete newUser.password;

            return 'Đăng ký thành công';
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email đã được đăng ký');
                }
            } else throw error;
        }
    }

    async signIn(signInDto: SignInDto) {
        try {
            // checking if user exists
            const userExisted = await this.prisma.user.findUniqueOrThrow({
                where: { email: signInDto.email },
            });

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
            } else throw error;
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
}
