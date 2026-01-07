export default ({ config }) => ({
    ...config,
    ios: {
        ...config.ios,
        config: {
            ...config.ios?.config,
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDKQzAl_-qFOsxqp4Wq2aobo41GyGjtEw0",
        },
    },
    android: {
        ...config.android,
        config: {
            ...config.android?.config,
            googleMaps: {
                ...config.android?.config?.googleMaps,
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDKQzAl_-qFOsxqp4Wq2aobo41GyGjtEw0",
            },
        },
    },
});
