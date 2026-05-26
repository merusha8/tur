import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ToursService } from './tours.service';
import { Public } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private toursService: ToursService) {}

  @Public()
  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.toursService.findAll({
      search: query.search,
      countryId: query.countryId,
      countryCode: query.countryCode,
      cityId: query.cityId,
      hotelId: query.hotelId,
      hotTour: query.hotTour === 'true',
      allInclusive: query.allInclusive === 'true',
      airline: query.airline,
      mealType: query.mealType,
      minStars: query.minStars ? +query.minStars : undefined,
      maxStars: query.maxStars ? +query.maxStars : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      adults: query.adults ? +query.adults : undefined,
      children: query.children ? +query.children : undefined,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      minDuration: query.minDuration ? +query.minDuration : undefined,
      maxDuration: query.maxDuration ? +query.maxDuration : undefined,
      page: query.page ? +query.page : 1,
      limit: query.limit ? +query.limit : 12,
      familyFriendly: query.familyFriendly === 'true',
      sort: query.sort,
      category: query.category,
    });
  }

  @Public()
  @Get('search-filters')
  getSearchFilters() {
    return this.toursService.getSearchFilters();
  }

  @Public()
  @Get('airlines')
  getAirlines() {
    return this.toursService.getAirlines();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.toursService.create(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.toursService.update(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }
}
