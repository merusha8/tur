import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { ResortsService } from './resorts.service';

@ApiTags('resorts')
@Controller('resorts')
export class ResortsController {
  constructor(private resortsService: ResortsService) {}

  @Public()
  @Get('beach-types')
  getBeachTypes() {
    return this.resortsService.getBeachTypes();
  }

  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('beachType') beachType?: string,
    @Query('cityId') cityId?: string,
    @Query('countryCode') countryCode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.resortsService.findAll({
      search,
      beachType,
      cityId,
      countryCode,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resortsService.findOne(id);
  }
}
