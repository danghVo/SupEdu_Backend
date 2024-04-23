import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
    password: string;

    @IsOptional()
    @IsString()
    textColor: string;

    @IsOptional()
    @IsBoolean()
    requireApprove: boolean;
}
