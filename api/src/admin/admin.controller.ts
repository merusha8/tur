import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('form-options')
  getFormOptions(
    @Query('citySearch') citySearch?: string,
    @Query('hotelSearch') hotelSearch?: string,
    @Query('tourSearch') tourSearch?: string,
  ) {
    return this.adminService.getFormOptions({ citySearch, hotelSearch, tourSearch });
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files allowed') as never, false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const port = process.env.PORT || 4000;
    const base = process.env.API_PUBLIC_URL || `http://localhost:${port}`;
    return { url: `${base}/uploads/${file.filename}` };
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('bookings')
  getBookings() {
    return this.adminService.getBookings();
  }

  @Get('flights')
  getFlights(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getFlights({
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('flights')
  createFlight(@Body() body: Record<string, unknown>) {
    return this.adminService.createFlight(body as never);
  }

  @Patch('flights/:id')
  updateFlight(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateFlight(id, body);
  }

  @Delete('flights/:id')
  deleteFlight(@Param('id') id: string) {
    return this.adminService.deleteFlight(id);
  }

  @Get('airports')
  getAirports(@Query('search') search?: string) {
    return this.adminService.getAirports(search);
  }

  @Get('hotels')
  getHotels() {
    return this.adminService.getHotels();
  }

  @Post('hotels')
  createHotel(@Body() body: Record<string, unknown>) {
    return this.adminService.createHotel(body as never);
  }

  @Patch('hotels/:id')
  updateHotel(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateHotel(id, body);
  }

  @Delete('hotels/:id')
  deleteHotel(@Param('id') id: string) {
    return this.adminService.deleteHotel(id);
  }

  @Get('countries')
  getCountries() {
    return this.adminService.getCountries();
  }

  @Post('countries')
  createCountry(@Body() body: Record<string, unknown>) {
    return this.adminService.createCountry(body as never);
  }

  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateCountry(id, body);
  }

  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.adminService.deleteCountry(id);
  }

  @Get('cities')
  getCities(@Query('countryId') countryId?: string) {
    return this.adminService.getCities(countryId);
  }

  @Post('cities')
  createCity(@Body() body: Record<string, unknown>) {
    return this.adminService.createCity(body as never);
  }

  @Patch('cities/:id')
  updateCity(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateCity(id, body);
  }

  @Delete('cities/:id')
  deleteCity(@Param('id') id: string) {
    return this.adminService.deleteCity(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: { role: 'USER' | 'ADMIN' }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() body: { banned: boolean }) {
    return this.adminService.updateUserBanned(id, body.banned);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('bookings/:id')
  updateBooking(@Param('id') id: string, @Body() body: { status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' }) {
    return this.adminService.updateBookingStatus(id, body.status);
  }

  @Get('destinations')
  getDestinations() {
    return this.adminService.getDestinations();
  }

  @Post('destinations')
  createDestination(@Body() body: Record<string, unknown>) {
    return this.adminService.createDestination(body as never);
  }

  @Patch('destinations/:id')
  updateDestination(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateDestination(id, body);
  }

  @Delete('destinations/:id')
  deleteDestination(@Param('id') id: string) {
    return this.adminService.deleteDestination(id);
  }

  @Get('tours')
  getTours(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTours({
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('tours')
  createTour(@Body() body: Record<string, unknown>) {
    return this.adminService.createTour(body as never);
  }

  @Patch('tours/:id')
  updateTour(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateTour(id, body);
  }

  @Delete('tours/:id')
  deleteTour(@Param('id') id: string) {
    return this.adminService.deleteTour(id);
  }

  @Get('hot-tours')
  getHotTours() {
    return this.adminService.getHotTours();
  }

  @Post('hot-tours')
  createHotTour(@Body() body: Record<string, unknown>) {
    return this.adminService.createHotTour(body as never);
  }

  @Patch('hot-tours/:id')
  updateHotTour(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateHotTour(id, body);
  }

  @Delete('hot-tours/:id')
  deleteHotTour(@Param('id') id: string) {
    return this.adminService.deleteHotTour(id);
  }

  @Get('payments')
  getPayments() {
    return this.adminService.getPayments();
  }

  @Get('reviews')
  getReviews(
    @Query('verified') verified?: string,
    @Query('featured') featured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReviews({
      verified,
      featured,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('reviews/:id')
  updateReview(@Param('id') id: string, @Body() body: { verified?: boolean; featured?: boolean }) {
    return this.adminService.updateReview(id, body);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  @Get('newsletter')
  getNewsletter() {
    return this.adminService.getNewsletterSubscriptions();
  }

  @Patch('newsletter/:id')
  updateNewsletter(@Param('id') id: string, @Body() body: { active: boolean }) {
    return this.adminService.updateNewsletterSubscription(id, body);
  }

  @Delete('newsletter/:id')
  deleteNewsletter(@Param('id') id: string) {
    return this.adminService.deleteNewsletterSubscription(id);
  }

  @Get('contact')
  getContactInquiries() {
    return this.adminService.getContactInquiries();
  }

  @Delete('contact/:id')
  deleteContactInquiry(@Param('id') id: string) {
    return this.adminService.deleteContactInquiry(id);
  }

  @Get('resorts')
  getResorts() {
    return this.adminService.getResorts();
  }

  @Post('resorts')
  createResort(@Body() body: Record<string, unknown>) {
    return this.adminService.createResort(body as never);
  }

  @Patch('resorts/:id')
  updateResort(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateResort(id, body);
  }

  @Delete('resorts/:id')
  deleteResort(@Param('id') id: string) {
    return this.adminService.deleteResort(id);
  }
}
