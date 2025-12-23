import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { AppMapView } from '../../../components/AppMapView';
import { Search, MapPin, Bike, Car, Truck, Menu, Bell, Locate, Plus, Minus } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_RIDE_OPTIONS } from '../../../utils/mockData';
import { router } from 'expo-router';
import { api, DriverLocation } from '../../../services/api';

export default function CustomerHome() {
    const { user } = useAuthStore();
    console.log("userdddd", user);
    const { t } = useTranslation();
    const mapRef = React.useRef<MapView>(null);
    const [driverLocations, setDriverLocations] = React.useState<DriverLocation[]>([]);

    React.useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            if (location && mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        })();

        const fetchDrivers = async () => {
            try {
                const drivers = await api.getDriverLocations();
                setDriverLocations(drivers);
            } catch (error) {
                console.log("Error fetching drivers", error);
            }
        };

        fetchDrivers();
        const interval = setInterval(fetchDrivers, 10000); // Pool every 10s
        return () => clearInterval(interval);
    }, []);

    const handleCurrentLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    const handleZoomIn = async () => {
        if (mapRef.current) {
            const camera = await mapRef.current.getCamera();
            if (camera) {
                camera.zoom = (camera.zoom || 15) + 1;
                mapRef.current.animateCamera(camera);
            }
        }
    };

    const handleZoomOut = async () => {
        if (mapRef.current) {
            const camera = await mapRef.current.getCamera();
            if (camera) {
                camera.zoom = (camera.zoom || 15) - 1;
                mapRef.current.animateCamera(camera);
            }
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* <AppMapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                    latitude: 13.7563,
                    longitude: 100.5018,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                <Marker coordinate={{ latitude: 13.7563, longitude: 100.5018 }}>
                    <View className="bg-white p-1.5 rounded-full border border-green-500 shadow-sm">
                        <Car size={16} color="black" />
                    </View>
                </Marker>
            </AppMapView> */}
            {/* <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                    latitude: 13.7563,
                    longitude: 100.5018,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                <Marker coordinate={{ latitude: 13.7563, longitude: 100.5018 }}>
                    <View className="bg-white p-1.5 rounded-full border border-green-500 shadow-sm">
                        <Car size={16} color="black" />
                    </View>
                </Marker>
            </MapView> */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}

                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {/* <Marker coordinate={{ latitude: 13.7563, longitude: 100.5018 }}>
                    <View className="bg-white p-1.5 rounded-full border border-green-500 shadow-sm">
                        <Car size={16} color="black" />
                    </View>
                </Marker> */}

                {/* Driver Markers */}
                {driverLocations.map((driver) => (
                    <Marker
                        key={`driver-${driver.id}`}
                        coordinate={{ latitude: driver.lat, longitude: driver.lng }}
                        title={driver.driver?.user?.full_name || "Driver"}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View className="bg-white p-1 rounded-full border border-green-500 shadow-sm">
                            {driver.driver?.vehicle_type === 'suv' ? (
                                <Bike size={16} color="#00A862" />
                            ) : driver.driver?.vehicle_type === 'van' ? (
                                <Truck size={16} color="#FF9100" />
                            ) : (
                                <Car size={16} color="#2962FF" />
                            )}
                        </View>
                    </Marker>
                ))}

            </MapView>

            <SafeAreaView className="absolute top-0 w-full px-5 pt-2 flex-row justify-between items-center z-10">
                <View className="flex-row items-center bg-white/90 p-2 pr-4 rounded-full shadow-md backdrop-blur-md">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-2">
                        <Text className="text-lg">👤</Text>
                    </View>
                    <View>
                        <Text className="text-xs text-gray-500">{t('home_screen.good_morning')}</Text>
                        <Text className="text-sm font-bold text-gray-800">{user?.full_name || t('home_screen.guest')}</Text>
                    </View>
                </View>

                <TouchableOpacity className="bg-white p-2.5 rounded-full shadow-md">
                    <Bell size={20} color="black" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Zoom Controls */}
            <View className="absolute right-5 bottom-[50%] z-50 flex-col gap-2">
                <TouchableOpacity
                    onPress={handleZoomIn}
                    className="bg-white p-3 rounded-full shadow-md elevation-5"
                >
                    <Plus size={24} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleZoomOut}
                    className="bg-white p-3 rounded-full shadow-md elevation-5"
                >
                    <Minus size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Current Location Button */}
            <TouchableOpacity
                onPress={handleCurrentLocation}
                className="absolute right-5 bottom-[42%] bg-white p-3 rounded-full shadow-md z-50 elevation-5"
            >
                <Locate size={24} color="#374151" />
            </TouchableOpacity>

            {/* Bottom Panel */}
            <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-2xl elevation-10 pb-5 pt-6 px-5 h-[40%] z-50">

                {/* Search Trigger */}
                <TouchableOpacity
                    onPress={() => router.push('/(customer)/booking/destination')}
                    className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-6 border border-gray-200 shadow-sm"
                >
                    <Search size={22} color="#6B7280" className="mr-3" />
                    <View>
                        <Text className="text-lg font-bold text-gray-800">{t('where_to')}</Text>
                        <Text className="text-xs text-gray-500">{t('home_screen.transport_safely')}</Text>
                    </View>
                </TouchableOpacity>

                {/* Quick Actions (Vehicles) */}
                {/* <View>
                    <Text className="text-base font-bold text-gray-800 mb-4">{t('choose_vehicle')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-4">
                        {MOCK_RIDE_OPTIONS.map((option) => (
                            <TouchableOpacity key={option.id} className="mr-4 items-center">
                                <View className="w-20 h-20 bg-green-50 rounded-2xl items-center justify-center border border-green-100 mb-2 shadow-sm">
                                    {option.id === 'bike' && <Bike size={32} color="#00A862" />}
                                    {option.id === 'car' && <Car size={32} color="#2962FF" />}
                                    {option.id === 'van' && <Truck size={32} color="#FF9100" />}
                                </View>
                                <Text className="font-semibold text-gray-700 text-sm">{option.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View> */}

            </View>
        </View>
    );
}
