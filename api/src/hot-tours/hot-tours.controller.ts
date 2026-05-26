import { Controller, Get, Param, Query } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators';

import { HotToursService } from './hot-tours.service';



@ApiTags('hot-tours')

@Controller('hot-tours')

export class HotToursController {

  constructor(private hotToursService: HotToursService) {}



  @Public()

  @Get('filters')

  getFilters() {

    return this.hotToursService.getFilters();

  }



  @Public()

  @Get()

  findAll(

    @Query('featured') featured?: string,

    @Query('lastMinute') lastMinute?: string,

    @Query('search') search?: string,

    @Query('cityId') cityId?: string,

    @Query('countryId') countryId?: string,

    @Query('minPrice') minPrice?: string,

    @Query('maxPrice') maxPrice?: string,

    @Query('mealPlan') mealPlan?: string,

    @Query('sort') sort?: string,

    @Query('page') page?: string,

    @Query('limit') limit?: string,

  ) {

    return this.hotToursService.findAll({

      featured: featured === 'true',

      lastMinute: lastMinute === 'true',

      search,

      cityId,

      countryId,

      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,

      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,

      mealPlan,

      sort,

      page: page ? parseInt(page, 10) : undefined,

      limit: limit ? parseInt(limit, 10) : undefined,

    });

  }



  @Public()

  @Get(':id')

  findOne(@Param('id') id: string) {

    return this.hotToursService.findOne(id);

  }

}

