import { IsOptional, IsString } from 'class-validator';

export class UpdateClassDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    theme: string;

    @IsOptional()
    @IsString()
    background: string;

    @IsOptional()
    @IsString()
    password: string;
}
