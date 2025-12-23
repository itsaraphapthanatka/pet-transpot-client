import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Animated, PanResponder, Dimensions, ScrollView, Platform, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppButton } from '../../../components/ui/AppButton';
import { Phone, MessageCircle, ArrowLeft, Navigation as NavIcon } from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useJobStore } from '../../../store/useJobStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { orderService } from '../../../services/orderService';
import { Order } from '../../../types/order';
import { hereMapApi, LatLng } from '../../../services/hereMapApi';
import * as Location from 'expo-location';

const HERE_API_KEY = "z8S6QWJ90hW5peIMiwDk9sCdlKEPj7cYiZz0fdoAbxU";

export default function ActiveJobScreen() {
    const { id } = useLocalSearchParams();
    const { activeJob, setActiveJob } = useJobStore();
    const mapRef = useRef<MapView>(null);
    const [status, setStatus] = useState<Order['status']>('accepted');
    const [isLoading, setIsLoading] = useState(true);
    const [order, setOrder] = useState<Order | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
    const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);

    // Animation for Bottom Sheet
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const SNAP_TOP = SCREEN_HEIGHT * 0.45;
    const SNAP_BOTTOM = SCREEN_HEIGHT - 280;

    const panY = useRef(new Animated.Value(SNAP_BOTTOM)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                panY.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                panY.flattenOffset();

                if (gestureState.dy > 50 || (gestureState.dy > 0 && gestureState.vy > 0.5)) {
                    Animated.spring(panY, {
                        toValue: SNAP_BOTTOM,
                        useNativeDriver: false,
                        tension: 50,
                        friction: 10
                    }).start();
                } else if (gestureState.dy < -50 || (gestureState.dy < 0 && gestureState.vy < -0.5)) {
                    Animated.spring(panY, {
                        toValue: SNAP_TOP,
                        useNativeDriver: false,
                        tension: 50,
                        friction: 10
                    }).start();
                } else {
                    Animated.spring(panY, {
                        toValue: gestureState.dy > 0 ? SNAP_BOTTOM : SNAP_TOP,
                        useNativeDriver: false
                    }).start();
                }
            }
        })
    ).current;

    // Watch Location
    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        const startWatching = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Get initial immediately
            const loc = await Location.getCurrentPositionAsync({});
            setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
                (loc) => {
                    setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                }
            );
        };
        startWatching();
        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    // Fetch Route
    useEffect(() => {
        const fetchRoute = async () => {
            if (!order) return;

            let origin: LatLng | null = null;
            let destination: LatLng | null = null;

            if (status === 'accepted' || status === 'arrived') {
                if (currentLocation) {
                    origin = currentLocation;
                } else {
                    origin = {
                        latitude: order.pickup_lat - 0.005,
                        longitude: order.pickup_lng - 0.005
                    };
                }
                destination = {
                    latitude: order.pickup_lat,
                    longitude: order.pickup_lng
                };
            } else if (status === 'picked_up' || status === 'in_progress') {
                if (currentLocation) {
                    origin = currentLocation;
                } else {
                    origin = {
                        latitude: order.pickup_lat,
                        longitude: order.pickup_lng
                    };
                }
                destination = {
                    latitude: order.dropoff_lat,
                    longitude: order.dropoff_lng
                };
            }

            if (origin && destination) {
                const route = await hereMapApi.getHereRoute(origin, destination, HERE_API_KEY);
                setRouteCoordinates(route);

                if (mapRef.current && route.length > 0) {
                    mapRef.current.fitToCoordinates(route, {
                        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                        animated: true,
                    });
                }
            }
        };

        fetchRoute();
    }, [order, status, currentLocation ? 1 : 0]);

    // Fetch Order
    useEffect(() => {
        let isMounted = true;

        const fetchOrder = async (isPolling = false) => {
            // Only show loader on initial fetch
            if (!isPolling) setIsLoading(true);

            try {
                const fetchedOrder = await orderService.getOrder(Number(id));

                if (!isMounted) return;

                // Update order state
                setOrder(fetchedOrder);
                setActiveJob(fetchedOrder);

                // Handle status transitions / alerts
                if (fetchedOrder.status === 'arrived') {
                    setStatus('arrived');
                } else if (fetchedOrder.status === 'picked_up' || fetchedOrder.status === 'in_progress') {
                    setStatus('in_progress');
                } else if (fetchedOrder.status === 'completed') {
                    setStatus('completed');
                } else if (fetchedOrder.status === 'accepted') {
                    setStatus('accepted');
                } else if (fetchedOrder.status === 'cancelled' || fetchedOrder.status === 'pending') {
                    if (isPolling) {
                        Alert.alert('Job Cancelled', 'The customer has cancelled this request.', [
                            { text: 'OK', onPress: () => router.replace('/(driver)/(tabs)/home') }
                        ]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                if (!isPolling && isMounted) setIsLoading(false);
            }
        };

        fetchOrder(false); // Initial load
        const interval = setInterval(() => fetchOrder(true), 5000); // Poll every 5 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [id]);

    const handleAction = async () => {
        if (!order) return;
        try {
            if (status === 'accepted') {
                await orderService.updateOrderStatus(order.id, 'arrived');
                setStatus('arrived');
            } else if (status === 'arrived') {
                await orderService.updateOrderStatus(order.id, 'in_progress');
                setStatus('in_progress');
            } else if (status === 'picked_up' || status === 'in_progress') {
                await orderService.updateOrderStatus(order.id, 'completed');
                setStatus('completed');
                Alert.alert("Job Completed", `Payment collected: ฿${order.price?.toFixed(0) || '-'}`, [
                    { text: "OK", onPress: () => router.replace('/(driver)/(tabs)/home') }
                ]);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            // Fallback status setting if needed, but usually better to let poll fix it
        }
    };

    const handleChat = () => {
        if (order) {
            router.push(`/(driver)/chat/${order.id}`);
        }
    };

    const openGoogleMaps = () => {
        if (!order) return;
        const lat = (status === 'accepted' || status === 'arrived') ? order.pickup_lat : order.dropoff_lat;
        const lng = (status === 'accepted' || status === 'arrived') ? order.pickup_lng : order.dropoff_lng;

        const url = Platform.OS === 'ios'
            ? `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`
            : `google.navigation:q=${lat},${lng}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
            }
        });
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#00A862" />
                <Text className="text-gray-500 mt-4">Loading job details...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-8">
                <Text className="text-xl font-bold text-gray-800 mb-2">Job Not Found</Text>
                <AppButton title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    const initialRegion = {
        latitude: (status === 'accepted' || status === 'arrived') ? order.pickup_lat : order.dropoff_lat,
        longitude: (status === 'accepted' || status === 'arrived') ? order.pickup_lng : order.dropoff_lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <View className="flex-1 bg-white">
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200">
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={initialRegion}
                    provider={PROVIDER_GOOGLE}
                >
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={4}
                            strokeColor="#3B82F6"
                        />
                    )}
                    {currentLocation && (
                        <Marker
                            coordinate={currentLocation}
                            title="You"
                        >
                            <View className="bg-white p-1 rounded-full border border-blue-600 shadow-sm">
                                <View className="w-3 h-3 bg-blue-600 rounded-full" />
                            </View>
                        </Marker>
                    )}
                    <Marker
                        coordinate={{ latitude: order.pickup_lat, longitude: order.pickup_lng }}
                        title="Pickup"
                    >
                        <View className="bg-white p-1 rounded-full border border-blue-500 shadow-sm">
                            <View className="w-2 h-2 bg-blue-500 rounded-full" />
                        </View>
                    </Marker>
                    <Marker
                        coordinate={{ latitude: order.dropoff_lat, longitude: order.dropoff_lng }}
                        title="Dropoff"
                    >
                        <View className="bg-white p-1 rounded-full border border-red-500 shadow-sm">
                            <View className="w-2 h-2 bg-red-500 rounded-full" />
                        </View>
                    </Marker>
                </MapView>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-5 bg-white p-2 rounded-full shadow-sm z-10"
                >
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
            </View>

            <Animated.View
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    top: panY,
                    backgroundColor: 'white',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}
            >
                <View
                    {...panResponder.panHandlers}
                    className="w-full items-center pt-3 pb-2 bg-white rounded-t-3xl"
                >
                    <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </View>

                <View className="flex-1 px-5 pt-2">
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                                    {(status === 'accepted' || status === 'arrived') ? 'Picking Up' : 'Dropping Off'}
                                </Text>
                                <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                                    {(status === 'accepted' || status === 'arrived') ? order.pickup_address : order.dropoff_address}
                                </Text>
                            </View>
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                                <Text className="text-green-600 font-bold text-lg">฿{order.price?.toFixed(0) || '-'}</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between border-t border-b border-gray-100 py-4 mb-4">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3">
                                    <Text className="text-xl">👤</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-800">{order.customer?.full_name || 'Customer'}</Text>
                                    <Text className="text-gray-500 text-xs">
                                        {order.pet?.type} ({order.pet?.name}) • {order.pet?.weight ? `${order.pet.weight}kg` : ''}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    className="bg-blue-100 p-3 rounded-full"
                                    onPress={openGoogleMaps}
                                >
                                    <NavIcon size={20} color="#2563EB" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-gray-100 p-3 rounded-full"
                                    onPress={handleChat}
                                >
                                    <MessageCircle size={20} color="black" />
                                </TouchableOpacity>
                                <TouchableOpacity className="bg-green-500 p-3 rounded-full">
                                    <Phone size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="bg-gray-50 p-3 rounded-lg mb-4 flex-row items-center">
                            <Text className="text-lg mr-2">
                                {order.pet?.type?.toLowerCase() === 'dog' ? '🐶' :
                                    order.pet?.type?.toLowerCase() === 'cat' ? '🐱' : '🐾'}
                            </Text>
                            <View className="flex-1">
                                <Text className="font-medium text-gray-800">{order.pet?.name}</Text>
                                <Text className="text-xs text-gray-500">
                                    {order.pet?.type} {order.pet?.breed ? `• ${order.pet.breed}` : ''} {order.pet?.weight ? `• ${order.pet.weight}kg` : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    "Cancel/Release Job",
                                    "Are you sure you want to cancel this job? It will be released back to other drivers.",
                                    [
                                        { text: "No", style: "cancel" },
                                        {
                                            text: "Yes, Cancel",
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    await orderService.cancelOrder(order.id, activeJob?.driver?.id);
                                                    setActiveJob(null);
                                                    Alert.alert("Job Cancelled", "You have released this job.", [
                                                        { text: "OK", onPress: () => router.replace('/(driver)/(tabs)/home') }
                                                    ]);
                                                } catch (error) {
                                                    Alert.alert("Error", "Failed to cancel job.");
                                                    console.error(error);
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                            className="bg-red-50 p-4 rounded-xl items-center mb-6 border border-red-100"
                        >
                            <Text className="text-red-500 font-bold">Cancel Job</Text>
                        </TouchableOpacity>

                        <View className="h-24" />
                    </ScrollView>
                </View>

                <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-10">
                    <AppButton
                        title={
                            status === 'accepted' ? 'Arrived at Pickup' :
                                status === 'arrived' ? 'Start traveling' :
                                    'Complete Job'
                        }
                        onPress={handleAction}
                        className={status === 'in_progress' ? 'bg-red-500' : 'bg-green-600'}
                        size="lg"
                    />
                </View>
            </Animated.View>
        </View>
    );
}
