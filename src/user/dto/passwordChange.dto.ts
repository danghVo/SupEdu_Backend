import { IsString, IsStrongPassword } from 'class-validator';

export class PasswordChagneDto {
    @IsString()
    oldPassword: string;

    @IsString()
    @IsStrongPassword(
        { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
        { message: 'Mật khẩu không đủ mạnh' },
    )
    newPassword: string;

    @IsString()
    confirmPassword: string;
}
