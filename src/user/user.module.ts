import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AwsModule } from 'src/aws/aws.module';

@Module({
    imports: [AwsModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
