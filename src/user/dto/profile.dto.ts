import { IsNumber, IsOptional, IsString, isEmpty } from 'class-validator';

export class ProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    age?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}
