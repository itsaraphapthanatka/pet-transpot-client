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
        return coordinates;
    } catch (error) {
        console.error('Failed to decode polyline:', error);
        return [];
    }
}

export interface HereRouteSegment {
    coordinates: LatLng[];
    color: string;
}

export interface HereRoute {
    coordinates: LatLng[];
    segments: HereRouteSegment[];
    distance: number; // in meters
    duration: number; // in seconds
    summary: string;
}


export const hereMapApi = {
    // Simple route for just getting coordinates (e.g. for destination preview)
    getHereRoute: async (
        origin: LatLng,
        destination: LatLng,
        apiKey: string
    ): Promise<LatLng[]> => {
        try {
            const originStr = `${origin.latitude},${origin.longitude}`;
            const destStr = `${destination.latitude},${destination.longitude}`;

            const url = `${HERE_ROUTING_API_URL}?transportMode=car&origin=${originStr}&destination=${destStr}&return=polyline&apiKey=${apiKey}`;

            // console.log("Fetching HERE Route (Simple):", url);
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

    // Get alternatives (complex object)
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

            // console.log("Fetching HERE Route Alternatives:", url);
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
                        segments: [], // No segments for alternatives to save perf
                        distance,
                        duration,
                        summary: `Route ${index + 1}`
                    };
                });
                return routes;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch HERE route alternatives:", error);
            return [];
        }
    },

    // Main function for Home Screen with Traffic Segments
    getRoutes: async (
        origin: LatLng,
        destination: LatLng,
        mode: 'car' | 'truck' | 'scooter' | 'bicycle',
        apiKey: string
    ): Promise<HereRoute[]> => {
        try {
            const originStr = `${origin.latitude},${origin.longitude}`;
            const destStr = `${destination.latitude},${destination.longitude}`;

            // Request routes from HERE API with specific mode and traffic spans
            // Ensure spans=dynamicSpeedInfo,length is included!
            const url = `${HERE_ROUTING_API_URL}?transportMode=${mode}&origin=${originStr}&destination=${destStr}&return=polyline,summary&spans=dynamicSpeedInfo,length&apiKey=${apiKey}`;

            console.log("Fetching HERE Routes with Traffic:", url);
            const response = await fetch(url);

            if (!response.ok) {
                console.error("HERE API Error:", response.status, await response.text());
                return [];
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const routes = data.routes.map((route: any, index: number) => {
                    const section = route.sections[0];
                    const allCoordinates = section && section.polyline ? decode(section.polyline) : [];

                    const distance = section?.summary?.length || 0;
                    const duration = section?.summary?.duration || 0;

                    const spans = section?.spans || [];
                    const segments: HereRouteSegment[] = [];

                    // GAP FIX: Visual line from Origin to Start of Route
                    if (origin && allCoordinates.length > 0) {
                        segments.push({
                            coordinates: [origin, allCoordinates[0]],
                            color: '#4285F4' // Same blue as safe route
                        });
                    }

                    if (spans.length > 0 && allCoordinates.length > 0) {
                        for (let i = 0; i < spans.length; i++) {
                            const span = spans[i];
                            const startIdx = span.offset;
                            // Ensure endIdx doesn't go out of bounds. 
                            // If it's the last span, it goes to the end of coordinates.
                            // If it's not the last span, it goes to the next span's offset.
                            const endIdx = (i < spans.length - 1) ? spans[i + 1].offset : allCoordinates.length - 1;

                            // Slice including endIdx? 
                            // slice(start, end) excludes end. 
                            // We want to connect segments, so we might overlap by 1 point.
                            // Let's use slice(startIdx, endIdx + 1)

                            const segmentCoords = allCoordinates.slice(startIdx, endIdx + 1);

                            // Safety check
                            if (segmentCoords.length < 2) continue;

                            // Calculate Traffic Color
                            let color = '#4285F4'; // Default Google Blue (Clear)

                            if (span.dynamicSpeedInfo) {
                                const trafficSpeed = span.dynamicSpeedInfo.trafficSpeed;
                                const baseSpeed = span.dynamicSpeedInfo.baseSpeed;

                                if (baseSpeed > 0) {
                                    const ratio = trafficSpeed / baseSpeed;
                                    // console.log(`Span Traffic: traffic=${trafficSpeed}, base=${baseSpeed}, ratio=${ratio.toFixed(2)}`);

                                    // Standard Sensitivity
                                    if (ratio < 0.50) {
                                        color = '#ef4444'; // Red (Traffic)
                                    } else if (ratio < 0.85) {
                                        color = '#eab308'; // Yellow (Moderate)
                                    }
                                }
                            }

                            segments.push({
                                coordinates: segmentCoords,
                                color: color
                            });
                        }
                    } else {
                        console.log("No Spans Found in Response!");
                        // If no spans returned, just use the whole line as one blue segment
                        segments.push({
                            coordinates: allCoordinates,
                            color: '#4285F4'
                        });
                    }

                    // GAP FIX: Visual line from End to Destination
                    if (destination && allCoordinates.length > 0) {
                        segments.push({
                            coordinates: [allCoordinates[allCoordinates.length - 1], destination],
                            color: '#4285F4'
                        });
                    }

                    console.log(`Calculated ${segments.length} traffic segments with gaps filled`);

                    return {
                        coordinates: allCoordinates, // Keeping original for strict logic if needed
                        segments: segments,
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
