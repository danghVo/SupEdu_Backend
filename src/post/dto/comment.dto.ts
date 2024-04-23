import { Option } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CommentDto {
    @IsString()
    content: string;

    @IsObject()
    createIn: { time: string; date: string };
}
