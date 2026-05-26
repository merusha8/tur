import { Module } from '@nestjs/common';
import { AmadeusService } from './amadeus/amadeus.service';
import { SkyscannerService } from './skyscanner/skyscanner.service';
import { FlightOfferCacheService } from './flight-offer-cache.service';
import { FlightSearchService } from './flight-search.service';
import { BookingComService } from './booking/booking-com.service';
import { ExpediaRapidService } from './expedia/expedia-rapid.service';
import { HotelOfferCacheService } from './hotel-offer-cache.service';
import { HotelSearchService } from './hotel-search.service';
import { GoogleMapsService } from './google/google-maps.service';

@Module({
  providers: [
    AmadeusService,
    SkyscannerService,
    FlightOfferCacheService,
    FlightSearchService,
    BookingComService,
    ExpediaRapidService,
    HotelOfferCacheService,
    HotelSearchService,
    GoogleMapsService,
  ],
  exports: [
    FlightSearchService,
    AmadeusService,
    SkyscannerService,
    HotelSearchService,
    BookingComService,
    ExpediaRapidService,
    GoogleMapsService,
  ],
})
export class IntegrationsModule {}
