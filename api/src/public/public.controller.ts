import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Public()
  @Get('home')
  getHome() {
    return this.publicService.getHome();
  }

  @Public()
  @Get('stats')
  getStats() {
    return this.publicService.getStats();
  }

  @Public()
  @Get('contact-info')
  getContactInfo() {
    return this.publicService.getContactInfo();
  }

  @Public()
  @Get('footer')
  getFooter() {
    return this.publicService.getFooter();
  }

  @Public()
  @Get('banner')
  getBanner(@Query('href') href: string) {
    return this.publicService.getPageBanner(href);
  }

  @Public()
  @Post('contact')
  submitContact(@Body() body: { firstName: string; lastName: string; email: string; subject: string; message: string }) {
    return this.publicService.submitContact(body);
  }

  @Public()
  @Post('newsletter')
  subscribeNewsletter(@Body() body: { email: string }) {
    return this.publicService.subscribeNewsletter(body.email);
  }
}
