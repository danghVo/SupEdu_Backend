import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString, IsStrongPassword } from 'class-validator';

type UserRole = 'TEACHER' | 'STUDENT';

export class SignUpDto {
    @IsNotEmpty()
    @IsEmail(
        {},
        {
            message: 'Sai định dạng email',
        },
    )
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    confirmPassword: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    role: UserRole;

    @IsNotEmpty()
    @IsNumber()
    age: number;
}
