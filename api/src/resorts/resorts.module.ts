import { Module } from '@nestjs/common';
import { ResortsController } from './resorts.controller';
import { ResortsService } from './resorts.service';

@Module({
  controllers: [ResortsController],
  providers: [ResortsService],
})
export class ResortsModule {}
