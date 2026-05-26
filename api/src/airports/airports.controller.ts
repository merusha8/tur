import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { AirportsService } from './airports.service';

@ApiTags('airports')
@Controller('airports')
export class AirportsController {
  constructor(private airportsService: AirportsService) {}

  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('countryCode') countryCode?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.airportsService.findAll({
      search,
      countryCode,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get(':iata')
  findByIata(@Param('iata') iata: string) {
    return this.airportsService.findByIata(iata);
  }
}
