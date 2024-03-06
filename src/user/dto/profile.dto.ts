import { IsNumber, IsOptional, IsString, isEmpty } from 'class-validator';

export class ProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    age?: number;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    role?: 'TEACHER' | 'STUDENT';
}
