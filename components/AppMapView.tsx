import React, { forwardRef } from 'react';
import MapView, { MapViewProps, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSettingsStore } from '../store/useSettingsStore';

// Placeholder for HERE Maps Tile URL. 
// Requires valid API Key. 
// Format: https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey={YOUR_API_KEY}
// Using OpenStreetMap as a visual proxy for "Not Google" if HERE key is missing, 
// or user can replace this URL.
const HERE_TILE_URL = "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const AppMapView = forwardRef<MapView, MapViewProps>((props, ref) => {
    const { mapProvider } = useSettingsStore();

    const isGoogle = mapProvider === 'google';

    return (
        <MapView
            ref={ref}
            {...props}
            provider={props.provider || (isGoogle ? PROVIDER_GOOGLE : undefined)}
            mapType={props.provider === PROVIDER_GOOGLE || isGoogle ? "standard" : "none"}
        >
            {props.children}
            {!isGoogle && (
                <UrlTile
                    urlTemplate={HERE_TILE_URL}
                    maximumZ={19}
                    flipY={false}
                />
            )}
        </MapView>
    );
});
