import { Module } from '@nestjs/common';
import { HotToursController } from './hot-tours.controller';
import { HotToursService } from './hot-tours.service';

@Module({
  controllers: [HotToursController],
  providers: [HotToursService],
})
export class HotToursModule {}
