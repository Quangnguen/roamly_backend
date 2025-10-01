// Base interface cho homestay data không có images
export interface BaseHomestayData {
  title: string;
  description: string;
  shortDesc?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  type: string;
  pricePerNight: number;
  currency?: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds?: number;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string[];
  cancellationPolicy?: string;
  minStay?: number;
  maxStay?: number;
  instantBook?: boolean;
  hostName?: string;
  phone?: string;
  email?: string;
}
