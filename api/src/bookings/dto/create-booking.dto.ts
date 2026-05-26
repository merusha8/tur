import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

enum BookingTypeDto {
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  TOUR = 'TOUR',
}

export class CreateBookingDto {
  @IsEnum(BookingTypeDto)
  type!: BookingTypeDto;

  @ValidateIf((o) => o.type === BookingTypeDto.FLIGHT)
  @IsString()
  flightId?: string;

  @ValidateIf((o) => o.type === BookingTypeDto.HOTEL)
  @IsString()
  hotelId?: string;

  @ValidateIf((o) => o.type === BookingTypeDto.TOUR)
  @IsString()
  tourId?: string;

  @IsOptional()
  @IsString()
  checkIn?: string;

  @IsOptional()
  @IsString()
  checkOut?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  guests?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passengers?: number;

  @IsNumber()
  @Min(0)
  totalPrice!: number;
}
