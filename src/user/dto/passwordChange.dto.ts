import { IsString, IsStrongPassword } from 'class-validator';

export class PasswordChagneDto {
    @IsString()
    oldPassword: string;

    @IsString()
    @IsStrongPassword()
    newPassword: string;
}
