import { Option } from '@prisma/client';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

interface VoteData {
    title: string;
    options: Array<Option>;
}

export class UpdatePostDto {
    @IsOptional()
    title: string;

    @IsOptional()
    content: string;

    @IsOptional()
    files: any;

    @IsOptional()
    voteData: string | null;

    @IsOptional()
    timeTaskEnd: string;

    @IsOptional()
    filesUpdate: string;

    @IsOptional()
    hashFiles: string;
}
