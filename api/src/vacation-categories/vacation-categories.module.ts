import { Module } from '@nestjs/common';
import { VacationCategoriesController } from './vacation-categories.controller';
import { VacationCategoriesService } from './vacation-categories.service';

@Module({
  controllers: [VacationCategoriesController],
  providers: [VacationCategoriesService],
  exports: [VacationCategoriesService],
})
export class VacationCategoriesModule {}
