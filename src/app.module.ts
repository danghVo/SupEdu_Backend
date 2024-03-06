import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ClassModule } from './class/class.module';
import { PostModule } from './post/post.module';
import { AwsModule } from './aws/aws.module';
import { FileModule } from './file/file.module';

@Module({
    imports: [
        AuthModule,
        PrismaModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        UserModule,
        ClassModule,
        PostModule,
        AwsModule,
        FileModule,
    ],
})
export class AppModule {}
