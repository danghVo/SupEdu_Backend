import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class SignInDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

