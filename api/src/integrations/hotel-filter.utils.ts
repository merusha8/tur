import { HotelSearchQuery, UnifiedHotelOffer } from './hotel-offer.types';

export function isAllInclusiveMeal(mealType: string): boolean {
  return mealType.toLowerCase().includes('all inclusive');
}

export function hasAmenity(amenities: string[], keyword: string): boolean {
  const k = keyword.toLowerCase();
  return amenities.some((a) => a.toLowerCase().includes(k));
}

export function offerHasBeach(offer: UnifiedHotelOffer): boolean {
  if (offer.beachAccess) return true;
  const bt = offer.resort?.beachType;
  return !!bt && bt !== 'None';
}

export function offerIsFamilyFriendly(offer: UnifiedHotelOffer): boolean {
  return hasAmenity(offer.amenities, 'Family Friendly')
    || (offer.stars >= 3 && hasAmenity(offer.amenities, 'Pool'));
}

export function offerIsLuxury(offer: UnifiedHotelOffer): boolean {
  return hasAmenity(offer.amenities, 'Luxury')
    || offer.stars >= 5
    || offer.pricePerNight >= 400;
}

export function offerHasTransfer(offer: UnifiedHotelOffer): boolean {
  return hasAmenity(offer.amenities, 'Transfer')
    || isAllInclusiveMeal(offer.mealType);
}

export function matchesHotelFilters(offer: UnifiedHotelOffer, query: HotelSearchQuery): boolean {
  if (query.minPrice != null && offer.pricePerNight < query.minPrice) return false;
  if (query.maxPrice != null && offer.pricePerNight > query.maxPrice) return false;
  if (query.minRating != null && offer.rating < query.minRating) return false;
  if (query.minStars != null && offer.stars < query.minStars) return false;

  if (query.allInclusive && !isAllInclusiveMeal(offer.mealType)) return false;
  if (query.mealType && !offer.mealType.toLowerCase().includes(query.mealType.toLowerCase())) return false;

  if (query.wifi && !hasAmenity(offer.amenities, 'Wi-Fi')) return false;
  if (query.pool && !hasAmenity(offer.amenities, 'Pool')) return false;
  if (query.beach && !offerHasBeach(offer)) return false;
  if (query.beachType && offer.resort?.beachType !== query.beachType) return false;
  if (query.familyFriendly && !offerIsFamilyFriendly(offer)) return false;
  if (query.luxury && !offerIsLuxury(offer)) return false;
  if (query.transferIncluded && !offerHasTransfer(offer)) return false;

  if (query.search && !offer.name.toLowerCase().includes(query.search.toLowerCase())) return false;

  return true;
}
