import { Option } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SubmitExerciseDto {
    @IsString()
    uuid: string;

    @IsOptional()
    timeAssign: string;

    @IsOptional()
    hashFiles: string;
}
