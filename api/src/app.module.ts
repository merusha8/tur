import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FlightsModule } from './flights/flights.module';
import { HotelsModule } from './hotels/hotels.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { DestinationsModule } from './destinations/destinations.module';
import { ToursModule } from './tours/tours.module';
import { SearchModule } from './search/search.module';
import { PublicModule } from './public/public.module';
import { CountriesModule } from './countries/countries.module';
import { CitiesModule } from './cities/cities.module';
import { AirportsModule } from './airports/airports.module';
import { ResortsModule } from './resorts/resorts.module';
import { HotToursModule } from './hot-tours/hot-tours.module';
import { VacationCategoriesModule } from './vacation-categories/vacation-categories.module';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FlightsModule,
    HotelsModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    FavoritesModule,
    NotificationsModule,
    AdminModule,
    DestinationsModule,
    ToursModule,
    SearchModule,
    PublicModule,
    CountriesModule,
    CitiesModule,
    AirportsModule,
    ResortsModule,
    HotToursModule,
    VacationCategoriesModule,
    MailModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
