import { File, Option } from '@prisma/client';
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

interface VoteData {
    title: string;
    options: Array<Option>;
}

export class CreatePostDto {
    @IsString()
    title: string;

    @IsOptional()
    content: string;

    @IsEnum(['Annoucement', 'Exercise', 'Vote'])
    type: 'Annoucement' | 'Exercise' | 'Vote';

    @IsOptional()
    @IsArray()
    files: Array<File>;

    @IsOptional()
    @IsObject()
    voteData: VoteData;

    @IsOptional()
    @IsObject()
    endTime: { endInTime: string; endInDate: string };
}
