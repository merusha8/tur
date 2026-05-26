import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { CountriesService } from './countries.service';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private countriesService: CountriesService) {}

  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('visaRequired') visaRequired?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.countriesService.findAll({
      search,
      visaRequired: visaRequired === 'true' ? true : visaRequired === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.countriesService.findOne(slug);
  }
}
