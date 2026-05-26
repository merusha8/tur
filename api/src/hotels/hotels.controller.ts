import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { Public } from '../common/decorators';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Public()
  @Get('providers')
  getProviders() {
    return this.hotelsService.getProviders();
  }

  @Public()
  @Get('search-filters')
  getSearchFilters() {
    return this.hotelsService.getSearchFilters();
  }

  @Public()
  @Get('search')
  search(@Query() query: Record<string, string>) {
    return this.hotelsService.search({
      city: query.city,
      cityId: query.cityId,
      resortId: query.resortId,
      countryCode: query.countryCode,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      guests: query.guests ? +query.guests : undefined,
      rooms: query.rooms ? +query.rooms : undefined,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      minRating: query.minRating ? +query.minRating : undefined,
      minStars: query.minStars ? +query.minStars : undefined,
      mealType: query.mealType,
      allInclusive: query.allInclusive === 'true',
      beach: query.beach === 'true',
      beachType: query.beachType,
      wifi: query.wifi === 'true',
      pool: query.pool === 'true',
      familyFriendly: query.familyFriendly === 'true',
      luxury: query.luxury === 'true',
      transferIncluded: query.transferIncluded === 'true',
      search: query.search,
      sort: query.sort,
      page: query.page ? +query.page : undefined,
      limit: query.limit ? +query.limit : undefined,
    });
  }

  @Public()
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.hotelsService.findAll({
      search: query.search,
      city: query.city,
      cityId: query.cityId,
      resortId: query.resortId,
      countryCode: query.countryCode,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      minRating: query.minRating ? +query.minRating : undefined,
      minStars: query.minStars ? +query.minStars : undefined,
      mealType: query.mealType,
      sort: query.sort,
      page: query.page ? +query.page : undefined,
      limit: query.limit ? +query.limit : undefined,
    });
  }

  @Public()
  @Get(':id/location')
  getLocation(@Param('id') id: string) {
    return this.hotelsService.getLocationContext(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hotelsService.findOne(id);
  }
}
