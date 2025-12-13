import { create } from 'zustand';

export interface Location {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface BookingState {
    pickupLocation: Location | null;
    dropoffLocation: Location | null;
    setPickupLocation: (location: Location | null) => void;
    setDropoffLocation: (location: Location | null) => void;
    clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    pickupLocation: null,
    dropoffLocation: null,
    setPickupLocation: (location) => set({ pickupLocation: location }),
    setDropoffLocation: (location) => set({ dropoffLocation: location }),
    clearBooking: () => set({ pickupLocation: null, dropoffLocation: null }),
}));
