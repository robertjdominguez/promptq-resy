export interface Coordinates {
  lat: number;
  lon: number;
}

export type VenueInfo = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  priceRange: number;
  neighborhood: string;
  rating: number;
  totalRatings: number;
  location: {
    lat: number;
    lon: number;
  };
  slots: Array<{
    start: string;
    end: string;
    type: string;
    slot_id: string;
  }>;
};

export interface CityCode {
  code: string;
}

export interface BookingResponse {
  token: string;
  success: boolean;
}
