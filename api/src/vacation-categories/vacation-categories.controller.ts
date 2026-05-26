import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { VacationCategoriesService } from './vacation-categories.service';

@ApiTags('vacation-categories')
@Controller('vacation-categories')
export class VacationCategoriesController {
  constructor(private service: VacationCategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }
}
