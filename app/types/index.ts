/** Core TypeScript interfaces for N1Lift */

export interface User {
  id: string;
  provider: 'google' | 'facebook' | 'apple' | 'whatsapp';
  display_name: string;
  email: string;
  avatar_url: string;
  phone_number?: string;
  home_address?: string;
  home_lat?: number;
  home_lng?: number;
  work_address?: string;
  work_lat?: number;
  work_lng?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  seats?: number;
  fuel_type?: 'Petrol' | 'Diesel' | 'Electric';
  created_at: string;
}

export interface Lift {
  id: string;
  driver_id: string;
  driver_name?: string;
  driver_avatar?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  from_address: string;
  from_lat: number;
  from_lng: number;
  to_address: string;
  to_lat: number;
  to_lng: number;
  departure_time: string;
  seats_available: number;
  seats_taken: number;
  distance_km?: number;
  fuel_cost_total?: number;
  cost_per_passenger?: number;
  notes?: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
}

export interface LiftRequest {
  id: string;
  lift_id: string;
  passenger_id: string;
  status: 'pending' | 'confirmed' | 'declined';
  created_at: string;
  // joined fields
  from_address?: string;
  to_address?: string;
  departure_time?: string;
  request_status?: string;
}

export interface MyLiftsResponse {
  offered: Lift[];
  requested: (Lift & { request_status: string })[];
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  LiftDetail: { liftId: string };
  OfferLift: undefined;
  FindLift: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MyLifts: undefined;
  Profile: undefined;
};
