import { IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    theme: string;

    @IsOptional()
    @IsString()
    background: string;
}
