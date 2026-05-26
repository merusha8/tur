import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FlightsService } from './flights.service';
import { Public } from '../common/decorators';

@ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private flightsService: FlightsService) {}

  @Public()
  @Get('providers')
  getProviders() {
    return this.flightsService.getProviders();
  }

  @Public()
  @Get('search')
  search(@Query() query: Record<string, string>) {
    return this.flightsService.search({
      origin: query.origin?.toUpperCase(),
      destination: query.destination?.toUpperCase(),
      departureDate: query.departureDate,
      returnDate: query.returnDate,
      adults: query.adults ? +query.adults : 1,
      children: query.children ? +query.children : 0,
      travelClass: query.travelClass,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      airline: query.airline,
      nonStop: query.nonStop === 'true',
      page: query.page ? +query.page : 1,
      limit: query.limit ? +query.limit : 20,
      sort: query.sort,
    });
  }

  @Public()
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.flightsService.findAll({
      origin: query.origin,
      destination: query.destination,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      airline: query.airline,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flightsService.findOne(id);
  }
}
