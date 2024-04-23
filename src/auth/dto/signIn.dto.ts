import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class SignInDto {
    @IsEmail(
        {},
        {
            message: 'Sai định dạng email',
        },
    )
    email: string;

    @IsString()
    password: string;
}
