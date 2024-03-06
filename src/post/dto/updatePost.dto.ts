import { Option } from '@prisma/client';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

interface VoteData {
    title: string;
    options: Array<Option>;
}

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    title: string;

    @IsOptional()
    content: string;

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
