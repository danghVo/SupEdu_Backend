import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString, IsStrongPassword } from 'class-validator';

type UserRole = 'TEACHER' | 'STUDENT';

export class SignUpDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsStrongPassword()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    role: UserRole;

    @IsNotEmpty()
    @IsNumber()
    age: number;
}
