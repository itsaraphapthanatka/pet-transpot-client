import { Platform } from 'react-native';
import * as flexpolyline from '@here/flexpolyline';

const HERE_ROUTING_API_URL = 'https://router.hereapi.com/v8/routes';

export interface LatLng {
    latitude: number;
    longitude: number;
}

// Decode using official HERE flexpolyline library
function decode(encoded: string): LatLng[] {
    try {
        const decoded = flexpolyline.decode(encoded);
        const coordinates: LatLng[] = decoded.polyline.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng
        }));

        console.log(`Decoded ${coordinates.length} coordinates using flexpolyline lib, first:`, coordinates[0], 'last:', coordinates[coordinates.length - 1]);
        return coordinates;
    } catch (error) {
        console.error('Failed to decode polyline:', error);
        return [];
    }
}

export interface HereRoute {
    coordinates: LatLng[];
    distance: number; // in meters
    duration: number; // in seconds
    summary: string;
}

export const hereMapApi = {
    getHereRoute: async (
        origin: LatLng,
        destination: LatLng,
        apiKey: string
    ): Promise<LatLng[]> => {
        try {
            const originStr = `${origin.latitude},${origin.longitude}`;
            const destStr = `${destination.latitude},${destination.longitude}`;

            const url = `${HERE_ROUTING_API_URL}?transportMode=car&origin=${originStr}&destination=${destStr}&return=polyline&apiKey=${apiKey}`;

            console.log("Fetching HERE Route:", url);
            const response = await fetch(url);

            if (!response.ok) {
                console.error("HERE API Error:", response.status, await response.text());
                return [];
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const section = data.routes[0].sections[0];
                if (section && section.polyline) {
                    return decode(section.polyline);
                }
            }

            return [];
        } catch (error) {
            console.error("Failed to fetch HERE route:", error);
            return [];
        }
    },

    getHereRouteAlternatives: async (
        origin: LatLng,
        destination: LatLng,
        apiKey: string,
        maxAlternatives: number = 3
    ): Promise<HereRoute[]> => {
        try {
            const originStr = `${origin.latitude},${origin.longitude}`;
            const destStr = `${destination.latitude},${destination.longitude}`;

            // Request alternatives from HERE API
            const url = `${HERE_ROUTING_API_URL}?transportMode=car&origin=${originStr}&destination=${destStr}&return=polyline,summary&alternatives=${maxAlternatives}&apiKey=${apiKey}`;

            console.log("Fetching HERE Route Alternatives:", url);
            const response = await fetch(url);

            if (!response.ok) {
                console.error("HERE API Error:", response.status, await response.text());
                return [];
            }

            const data = await response.json();
            console.log("HERE API Response:", JSON.stringify(data, null, 2));

            if (data.routes && data.routes.length > 0) {
                const routes = data.routes.map((route: any, index: number) => {
                    const section = route.sections[0];
                    const coordinates = section && section.polyline ? decode(section.polyline) : [];

                    // Extract distance and duration
                    const distance = section?.summary?.length || 0; // in meters
                    const duration = section?.summary?.duration || 0; // in seconds

                    console.log(`Route ${index + 1}:`, {
                        coordinatesCount: coordinates.length,
                        distance,
                        duration,
                        firstCoord: coordinates[0],
                        lastCoord: coordinates[coordinates.length - 1]
                    });

                    return {
                        coordinates,
                        distance,
                        duration,
                        summary: `Route ${index + 1}`
                    };
                });

                console.log(`Returning ${routes.length} routes`);
                return routes;
            }

            console.warn("No routes found in HERE API response");
            return [];
        } catch (error) {
            console.error("Failed to fetch HERE route alternatives:", error);
            return [];
        }
    },

    getRoutes: async (
        origin: LatLng,
        destination: LatLng,
        mode: 'car' | 'truck' | 'scooter' | 'bicycle',
        apiKey: string
    ): Promise<HereRoute[]> => {
        try {
            const originStr = `${origin.latitude},${origin.longitude}`;
            const destStr = `${destination.latitude},${destination.longitude}`;

            // Request routes from HERE API with specific mode
            const url = `${HERE_ROUTING_API_URL}?transportMode=${mode}&origin=${originStr}&destination=${destStr}&return=polyline,summary&apiKey=${apiKey}`;

            console.log("Fetching HERE Routes with mode:", mode, url);
            const response = await fetch(url);

            if (!response.ok) {
                console.error("HERE API Error:", response.status, await response.text());
                return [];
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const routes = data.routes.map((route: any, index: number) => {
                    const section = route.sections[0];
                    const coordinates = section && section.polyline ? decode(section.polyline) : [];

                    const distance = section?.summary?.length || 0;
                    const duration = section?.summary?.duration || 0;

                    return {
                        coordinates,
                        distance,
                        duration,
                        summary: `Route ${index + 1}`
                    };
                });
                return routes;
            }

            return [];
        } catch (error) {
            console.error("Failed to fetch HERE routes:", error);
            return [];
        }
    }
};

