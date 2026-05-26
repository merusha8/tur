import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, Public } from '../common/decorators';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Public()
  @Get()
  findAll(
    @Query('flightId') flightId?: string,
    @Query('hotelId') hotelId?: string,
    @Query('tourId') tourId?: string,
    @Query('destinationId') destinationId?: string,
    @Query('featured') featured?: string,
    @Query('rating') rating?: string,
    @Query('verified') verified?: string,
    @Query('sort') sort?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'verified',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.findAll({
      flightId,
      hotelId,
      tourId,
      destinationId,
      featured: featured === 'true',
      rating: rating ? +rating : undefined,
      verified: verified === 'true' ? true : undefined,
      sort,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: {
    flightId?: string;
    hotelId?: string;
    tourId?: string;
    destinationId?: string;
    rating: number;
    title?: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
    location?: string;
  }) {
    return this.reviewsService.create(user.id, body);
  }
}
