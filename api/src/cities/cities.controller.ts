import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { CitiesService } from './cities.service';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('countryId') countryId?: string,
    @Query('countryCode') countryCode?: string,
    @Query('popular') popular?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.citiesService.findAll({
      search,
      countryId,
      countryCode,
      popular: popular === 'true',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.citiesService.findOne(slug);
  }
}
