
export interface PricingRequest {
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    vehicle_type: string;
    pet_weight_kg: number;
    provider?: string;
}

export interface PricingResponse {
    estimated_price: number;
    distance_km: number;
    duration_min: number;
}

export interface DriverDetails {
    user_id: number;
    vehicle_type: string;
    vehicle_plate: string;
    is_online: boolean;
    id: number;
    user: {
        full_name: string;
        phone: string;
        email: string;
        id: number;
    }
}

export interface DriverLocation {
    driver_id: number;
    lat: number;
    lng: number;
    id: number;
    driver: DriverDetails;
}

export interface VehicleTypeRate {
    base: number;
    per_km: number;
    per_min: number;
    min: number;
}

export interface VehicleType {
    key: string;
    name: string;
    rates: VehicleTypeRate;
}

export interface PricingSettings {
    map: string;
    id: number;
}

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Platform.OS === 'android' ? process.env.EXPO_PUBLIC_API_BASE_URL : process.env.EXPO_PUBLIC_API_BASE_URL;
const TOKEN_KEY = '@pet_transport_token';

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export const api = {
    getVehicleTypes: async (): Promise<VehicleType[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/pricing/vehicle-types`);
            if (!response.ok) {
                throw new Error('Failed to fetch vehicle types');
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not fetch vehicle types from backend:', error);
            throw error;
        }
    },

    getPricingSettings: async (): Promise<PricingSettings> => {
        try {
            const response = await fetch(`${API_BASE_URL}/pricing/settings`);
            if (!response.ok) {
                throw new Error('Failed to fetch pricing settings');
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not fetch pricing settings from backend:', error);
            throw error;
        }
    },

    estimatePrice: async (req: PricingRequest): Promise<PricingResponse> => {
        try {
            console.log("Sending estimatePrice request:", JSON.stringify(req, null, 2));
            const response = await fetch(`${API_BASE_URL}/pricing/estimate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Could not estimate price from backend:', error);
            throw error;
        }
    },

    getDriverLocations: async (): Promise<DriverLocation[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/driver_locations/`);
            if (!response.ok) {
                throw new Error('Failed to fetch driver locations');
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not fetch driver locations from backend:', error);
            // Return empty array instead of throwing to prevent blocking the UI
            return [];
        }
    },

    getDriverLocationById: async (id: number): Promise<DriverLocation | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/driver_locations/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch driver location');
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not fetch driver location from backend:', error);
            // Return null instead of throwing to prevent blocking the UI
            return null;
        }
    },

    updateDriverLocation: async (_userId: number, lat: number, lng: number): Promise<void> => {
        try {
            const headers = await getAuthHeaders();

            // Using the new optimized PUT /driver_locations/me endpoint
            const response = await fetch(`${API_BASE_URL}/driver_locations/me`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ lat, lng }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Failed to update driver location via PUT /me: ${response.status} - ${errorText}`);
            } else {
                console.log("Location successfully updated via PUT /me");
            }
        } catch (error) {
            console.error('Error in updateDriverLocation:', error);
        }
    },

    updateDriverStatus: async (isOnline: boolean, lat?: number, lng?: number): Promise<void> => {
        try {
            const headers = await getAuthHeaders();
            console.log(`Updating driver status to: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

            const body: any = { is_online: isOnline };
            if (isOnline && lat !== undefined && lng !== undefined) {
                body.lat = lat;
                body.lng = lng;
            }

            const response = await fetch(`${API_BASE_URL}/drivers/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update driver status: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error updating driver status:', error);
            throw error;
        }
    },

    getChatHistory: async (orderId: number): Promise<any[]> => {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/chat/${orderId}`, {
                headers,
            });
            console.log("getChatHistory response", response);
            if (!response.ok) {
                throw new Error('Failed to fetch chat history');
            }
            return await response.json();
        } catch (error) {
            console.warn('Could not fetch chat history', error);
            return [];
        }
    },

    markChatRead: async (orderId: number, userId: number): Promise<void> => {
        try {
            const headers = await getAuthHeaders();
            await fetch(`${API_BASE_URL}/chat/${orderId}/read?user_id=${userId}`, {
                method: 'POST',
                headers,
            });
        } catch (error) {
            console.warn('Could not mark chat as read', error);
        }
    }
};
