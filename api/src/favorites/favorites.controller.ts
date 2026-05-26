import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.favoritesService.findAll(user.id);
  }

  @Post('toggle')
  toggle(@CurrentUser() user: { id: string }, @Body() body: { flightId?: string; hotelId?: string; tourId?: string }) {
    return this.favoritesService.toggle(user.id, body);
  }
}
