import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Platform, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapView from 'react-native-maps';
import { AppMapView } from '../../../components/AppMapView';
import { PetGoCarIcon } from '../../../components/icons/PetGoCarIcon';
import { RouteErrorBanner } from '../../../components/RouteErrorBanner';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { AppButton } from '../../../components/ui/AppButton';
import { ArrowLeft, MapPin, Clock, CreditCard, StickyNote, ChevronRight, Wallet, Bike, Car, Truck, Phone, MessageCircle, Star, PawPrint, User, Tag, X } from 'lucide-react-native';
import { Switch } from 'react-native';
import { MOCK_RIDE_OPTIONS } from '../../../utils/mockData';
import { useBookingStore } from '../../../store/useBookingStore';
import { api, DriverLocation, PricingResponse } from '../../../services/api';
import {
    googleDirectionsApi, LatLng, DirectionsRoute, DirectionsSegment, RouteRequest, RouteRequestRecord, TransportMode,
    isRoutingError, shouldRefetchRoute, trimRouteToPoint,
} from '../../../services/googleDirectionsApi';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { Dimensions, Animated, PanResponder, Image } from 'react-native';
import { orderService } from '../../../services/orderService';
import { useAuthStore } from '../../../store/useAuthStore';
import { Order } from '../../../types/order';
import * as Location from 'expo-location';
import { formatPrice } from '../../../utils/format';
import { isApiError, errorDetail } from '../../../utils/apiError';

// Extend MOCK_RIDE_OPTIONS to match VEHICLE_TYPES expectation (surcharge)
// Extend MOCK_RIDE_OPTIONS to match VEHICLE_TYPES expectation (surcharge)
// Initial state will be empty, fetched from API
const INITIAL_VEHICLES: any[] = [];

export default function ConfirmBookingScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const petWeight = params.petWeight ? Number(params.petWeight) : 0;
    // Pets on the trip: the estimate needs the count for the multi-pet discount the server also applies at booking
    const petCount = params.petIds ? (String(params.petIds).split(',').filter(Boolean).length || 1) : 1;
    // const petName = params.petName as string; // Legacy single pet
    // const petType = params.petType as string; // Legacy single pet
    const passengers = params.passengers ? Number(params.passengers) : 1;
    const existingOrderId = params.orderId ? Number(params.orderId) : null;

    // Parse pet names if passed as a comma-separated string or array
    const petNamesRaw = params.petNames;
    const displayPetNames = petNamesRaw
        ? (Array.isArray(petNamesRaw) ? petNamesRaw.join(', ') : petNamesRaw)
        : 'Unknown Pet';

    const mapRef = useRef<MapView>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [note, setNote] = useState('');
    const { pickupLocation, dropoffLocation, stops, clearBooking } = useBookingStore();
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);
    const [price, setPrice] = useState(0);
    const [loadingPrice, setLoadingPrice] = useState(false);
    // Why the server could not price the trip; while set, booking is disabled (there is no local fallback price)
    const [priceError, setPriceError] = useState<string | null>(null);
    const priceSeqRef = useRef(0);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [directionsRoutes, setDirectionsRoutes] = useState<DirectionsRoute[]>([]);
    const [routeError, setRouteError] = useState<unknown>(null);
    const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
    const [weightSurcharge, setWeightSurcharge] = useState(0);
    const [multiPetDiscount, setMultiPetDiscount] = useState(0);
    const [surgeMultiplier, setSurgeMultiplier] = useState(1);
    const [surgeReasons, setSurgeReasons] = useState<string[]>([]);
    const [roundTripFee, setRoundTripFee] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'promptpay' | 'wallet' | 'stripe'>('cash');
    const [walletBalance, setWalletBalance] = useState(0);
    const [savedCards, setSavedCards] = useState<any[]>([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<{ cash: boolean; promptpay: boolean; wallet: boolean; stripe: boolean }>({ cash: true, promptpay: true, wallet: true, stripe: true });

    // Round Trip State
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    const [returnOption, setReturnOption] = useState<'immediate' | 'time'>('immediate');
    const [returnTimeText, setReturnTimeText] = useState('');

    // Promo Code State
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [promoError, setPromoError] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    // Booking State
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'searching' | 'confirmed'>('idle');
    const bookingStatusRef = useRef(bookingStatus);

    // Sync Ref with State
    useEffect(() => {
        bookingStatusRef.current = bookingStatus;
    }, [bookingStatus]);

    const [assignedDriver, setAssignedDriver] = useState<DriverLocation | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const shareLocationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const prevStatusRef = useRef<Order['status'] | null>(null);
    const { user } = useAuthStore();

    // Fetch payment config on mount
    useEffect(() => {
        const fetchPaymentConfig = async () => {
            try {
                const config = await api.getPaymentConfig();
                setPaymentConfig(config);
                // Set default payment method to first enabled option
                if (!config.cash && config.promptpay) setPaymentMethod('promptpay');
                else if (!config.cash && !config.promptpay && config.wallet) setPaymentMethod('wallet');
                else if (!config.cash && !config.promptpay && !config.wallet && config.stripe) setPaymentMethod('stripe');
            } catch (error) {
                console.error('Failed to fetch payment config:', error);
            }
        };
        fetchPaymentConfig();
    }, []);

    // Check for first-time user to auto-apply WELCOME50 promo
    useEffect(() => {
        const checkFirstTimeUser = async () => {
            if (!user || user.role !== 'customer') return;
            if (price <= 0 || appliedPromo) return; // Wait for price to load or if promo already applied

            try {
                // Check if user has any past orders
                const pastOrders = await orderService.getOrders();
                if (pastOrders.length === 0) {
                    // First time user, try applying WELCOME50
                    const res = await api.validatePromo({ code: 'WELCOME50', order_value: price });
                    setAppliedPromo(res);
                    setPromoCode('WELCOME50');
                }
            } catch (error) {
                console.log('Error checking first time user for promo:', error);
                // Ignore errors, just don't apply the promo
            }
        };

        checkFirstTimeUser();
    }, [user, price]); // Run when user or price is available

    // Effect for Hydrating Existing Order
    useEffect(() => {
        if (!existingOrderId) return;

        const hydrateOrder = async () => {
            try {
                const order = await orderService.getOrder(existingOrderId);
                setCurrentOrder(order);
                setBookingStatus(
                    ['accepted', 'arrived', 'in_progress', 'picked_up'].includes(order.status)
                        ? 'confirmed'
                        : 'searching' // 'pending' maps to 'searching'
                );

                // Hydrate Locations if missing from store (e.g. app restart)
                // Note: We might want to do this to ensure map is correct even if store was empty
                useBookingStore.setState({
                    pickupLocation: {
                        name: order.pickup_address,
                        address: order.pickup_address,
                        latitude: order.pickup_lat,
                        longitude: order.pickup_lng
                    },
                    dropoffLocation: {
                        name: order.dropoff_address,
                        address: order.dropoff_address,
                        latitude: order.dropoff_lat,
                        longitude: order.dropoff_lng
                    }
                });

                setPrice(order.price || 0);
                // We'd ideally need vehicle info too, maybe derive from order or default
                // Setting a default so things don't crash
                if (vehicles.length > 0) setSelectedVehicle(vehicles[0]);

                console.log("Hydrated order:", order.id, order.status);
            } catch (error) {
                console.error("Failed to hydrate order:", error);
                Alert.alert("Error", "Could not load active order.");
                router.replace('/(customer)/(tabs)/home');
            }
        };

        hydrateOrder();
    }, [existingOrderId]);

    // Animation for Bottom Sheet
    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const SNAP_MAX = SCREEN_HEIGHT * 0.15; // 85% height
    const SNAP_TOP = SCREEN_HEIGHT * 0.40; // 60% height (Initial view)
    const SNAP_BOTTOM = SCREEN_HEIGHT - 180; // Collapsed (leave 180px visible)
    const SNAP_DRIVER = SCREEN_HEIGHT - 320; // Height for Driver Found card (approx 320px)

    const panY = useRef(new Animated.Value(SNAP_TOP)).current;

    // Auto-snap when booking confirmed
    React.useEffect(() => {
        if (bookingStatus === 'confirmed') {
            Animated.spring(panY, {
                toValue: SNAP_DRIVER,
                useNativeDriver: false,
                tension: 50,
                friction: 10
            }).start();
        }
    }, [bookingStatus]);

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

                const currentY = (panY as any)._value; // Access internal value for calculation
                const targetBottom = bookingStatus === 'confirmed' ? SNAP_DRIVER : SNAP_BOTTOM;

                // Possible snap points when idle
                const snapPoints = bookingStatus === 'confirmed'
                    ? [SNAP_DRIVER, SNAP_TOP] // When confirmed, maybe just driver and mid? 
                    : [SNAP_MAX, SNAP_TOP, SNAP_BOTTOM];

                // Determine direction and velocity to snap
                if (Math.abs(gestureState.vy) > 0.5) {
                    // Velocity-based snapping
                    if (gestureState.vy > 0) {
                        // Moving Down
                        const destination = currentY < SNAP_TOP ? SNAP_TOP : targetBottom;
                        Animated.spring(panY, { toValue: destination, useNativeDriver: false }).start();
                    } else {
                        // Moving Up
                        const destination = currentY > SNAP_TOP ? SNAP_TOP : SNAP_MAX;
                        Animated.spring(panY, { toValue: destination, useNativeDriver: false }).start();
                    }
                } else {
                    // Position-based snapping (snap to nearest)
                    let closest = snapPoints[0];
                    let minDiff = Math.abs(currentY - snapPoints[0]);

                    for (let i = 1; i < snapPoints.length; i++) {
                        const diff = Math.abs(currentY - snapPoints[i]);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = snapPoints[i];
                        }
                    }

                    Animated.spring(panY, { toValue: closest, useNativeDriver: false }).start();
                }
            }
        })
    ).current;

    // Fetch wallet balance and cards on focus
    useFocusEffect(
        React.useCallback(() => {
            const fetchBalance = async () => {
                try {
                    const res = await api.getWalletBalance();
                    setWalletBalance(res.wallet_balance || 0);
                } catch (error) {
                    console.log("Error fetching wallet balance", error);
                }
            };

            const fetchCards = async () => {
                setIsLoadingCards(true);
                try {
                    const cards = await api.getPaymentMethods();
                    setSavedCards(cards);
                    // Only auto-select if nothing is selected or if we previously had nothing
                    if (cards.length > 0 && (paymentMethod === 'cash' || savedCards.length === 0)) {
                        setPaymentMethod('stripe');
                    }
                } catch (error) {
                    console.log("Error fetching payment methods", error);
                } finally {
                    setIsLoadingCards(false);
                }
            };

            fetchBalance();
            fetchCards();
        }, [])
    );

    // Fetch Driver Locations
    React.useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const drivers = await api.getDriverLocations();
                setDriverLocations(drivers);
            } catch (error) {
                console.log("Error fetching drivers", error);
            }
        };

        fetchDrivers();
        // Poll every 5 seconds for better real-time updates
        const interval = setInterval(fetchDrivers, 5000);

        return () => clearInterval(interval);
    }, []);

    const driverLocationsRef = useRef(driverLocations);

    // Sync Ref with State and Sync Assigned Driver with Live Locations
    React.useEffect(() => {
        driverLocationsRef.current = driverLocations;

        if (bookingStatus === 'confirmed' && currentOrder?.driver_id) {
            const liveDriver = driverLocations.find(d => d.driver?.id === currentOrder.driver_id);
            if (liveDriver) {
                // If we don't have an assigned driver yet, OR if the location changed
                if (!assignedDriver || liveDriver.lat !== assignedDriver.lat || liveDriver.lng !== assignedDriver.lng) {
                    console.log("Syncing assigned driver location:", liveDriver.lat, liveDriver.lng);
                    setAssignedDriver(liveDriver);
                }
            }
        }
    }, [driverLocations, bookingStatus, assignedDriver, currentOrder]);

    // Fetch Vehicle Types
    React.useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const apiVehicles = await api.getVehicleTypes();
                // Merge with mock data to get images and descriptions
                const mergedVehicles = apiVehicles.map(v => {
                    const mock = MOCK_RIDE_OPTIONS.find(m => m.id === v.key);
                    return {
                        id: v.key,
                        name: v.name,
                        image: v.image_url || mock?.image || 'car', // Fallback
                        description: mock?.description || '',
                        basePrice: v.rates.base,
                        perKmRate: v.rates.per_km,
                        perMinRate: v.rates.per_min,
                        minPrice: v.rates.min,
                        surcharge: 0
                    };
                });
                setVehicles(mergedVehicles);
                if (mergedVehicles.length > 0) {
                    setSelectedVehicle(mergedVehicles[0]);
                }
            } catch (error) {
                console.warn("Could not fetch vehicles from backend, using mock data:", error);
                // Fallback to mock data when backend is unavailable
                setVehicles(MOCK_RIDE_OPTIONS);
                if (MOCK_RIDE_OPTIONS.length > 0) {
                    setSelectedVehicle(MOCK_RIDE_OPTIONS[0]);
                }
            } finally {
                setLoadingVehicles(false);
            }
        };

        fetchVehicles();
    }, []);

    // Fetch Price from API. The server is the only source of the price: POST /orders/ re-prices the trip with
    // the same engine and refuses a quote below its fare, so a locally computed number (which also ignored the
    // per-stop and round-trip fees) would only be rejected. On failure the reason is shown and booking stays
    // disabled until an estimate arrives. The 409 handler calls this again to refresh the quote.
    const fetchPrice = useCallback(async (): Promise<PricingResponse | null> => {
        if (!pickupLocation || !dropoffLocation || !selectedVehicle) return null;
        const seq = ++priceSeqRef.current; // a newer request (e.g. vehicle switch) owns the UI
        setLoadingPrice(true);
        try {
            const response = await api.estimatePrice({
                pickup_lat: pickupLocation.latitude,
                pickup_lng: pickupLocation.longitude,
                dropoff_lat: dropoffLocation.latitude,
                dropoff_lng: dropoffLocation.longitude,
                stops: stops.map(s => ({ lat: s.latitude, lng: s.longitude })),
                pet_weight_kg: petWeight,
                pet_count: petCount,
                vehicle_type: selectedVehicle.id,
                is_round_trip: isRoundTrip
            });
            if (seq !== priceSeqRef.current) return response;
            setPrice(response.estimated_price);
            setPriceError(null);
            setWeightSurcharge(response.weight_surcharge || 0);
            setMultiPetDiscount(response.multi_pet_discount || 0);
            setSurgeMultiplier(response.surge_multiplier || 1);
            setSurgeReasons(response.surge_reasons || []);
            setRoundTripFee(response.round_trip_fee || 0);
            // Use backend distance/duration if available (fallback for Google Maps failure)
            if (response.distance_km) setDistance(response.distance_km);
            if (response.duration_min) setDuration(response.duration_min);
            return response;
        } catch (error) {
            if (seq === priceSeqRef.current) {
                console.warn('Could not fetch price from backend:', error);
                setPrice(0);
                setPriceError(errorDetail(error));
            }
            throw error;
        } finally {
            if (seq === priceSeqRef.current) setLoadingPrice(false);
        }
    }, [pickupLocation, dropoffLocation, stops, selectedVehicle, petWeight, petCount, isRoundTrip]);

    // `distance` is no longer a dependency: it only fed the removed local fallback, and because the estimate
    // itself sets it, keeping it re-ran this effect (a second billed request) after every estimate.
    React.useEffect(() => {
        fetchPrice().catch(() => { /* the reason is shown via priceError */ });
    }, [fetchPrice]);

    // Calculate Route Origin/Dest based on status.
    // Once confirmed the origin is the driver's live position only. While hydrating an existing order
    // the location feed has not delivered it yet; a pickup fallback here sent a pickup->pickup request
    // that shouldRefetchRoute() recorded, blocking the real driver->pickup route for 30 s (forever if
    // the driver sits still, because this effect only re-runs when assignedDriver changes).
    const routeOrigin = bookingStatus === 'confirmed'
        ? (assignedDriver ? { latitude: assignedDriver.lat, longitude: assignedDriver.lng } : null)
        : (pickupLocation ? { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude } : null);

    const routeDestination = (bookingStatus === 'confirmed' && currentOrder?.status !== 'in_progress' && currentOrder?.status !== 'picked_up')
        ? (pickupLocation ? { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude } : null)
        : (dropoffLocation ? { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude } : null);

    const [driverDuration, setDriverDuration] = useState(0);

    const routeRequestRef = useRef<RouteRequestRecord | null>(null);
    const routeSeqRef = useRef(0);

    // Between (throttled) refetches, start the drawn approach route at the driver's live position
    const displayedSegments = useMemo<DirectionsSegment[]>(() => {
        const route = directionsRoutes[0];
        if (!route) return [];
        if (bookingStatus === 'confirmed' && assignedDriver && route.segments.length > 0) {
            const driverPosition = { latitude: assignedDriver.lat, longitude: assignedDriver.lng };
            return [{ ...route.segments[0], coordinates: trimRouteToPoint(route.segments[0].coordinates, driverPosition) }];
        }
        return route.segments;
    }, [directionsRoutes, bookingStatus, assignedDriver]);

    // Fetch Google Directions route when origin/dest changes.
    // The 5 s driver poll re-runs this effect; shouldRefetchRoute() only lets a (billed) request out
    // when the target changed, or the driver moved >= 50 m and >= 30 s passed. Otherwise the drawn
    // route stays untouched (no flicker).
    useEffect(() => {
        if (!routeOrigin || !routeDestination) return;

        // Determine mode (car/bike/truck) based on selected vehicle or default to car
        const mode: TransportMode = selectedVehicle?.id === 'bike' ? 'scooter' :
            selectedVehicle?.id === 'van' ? 'truck' : 'car';
        const request: RouteRequest = {
            origin: routeOrigin,
            destination: routeDestination,
            stops: bookingStatus === 'idle' ? stops.map(s => ({ latitude: s.latitude, longitude: s.longitude })) : [],
            mode,
        };
        if (!shouldRefetchRoute(routeRequestRef.current, request)) return;

        const seq = ++routeSeqRef.current;
        routeRequestRef.current = { request, at: Date.now(), failed: false };

        const fetchRoutes = async () => {
            try {
                const routes = await googleDirectionsApi.getRoutes(request.origin, request.destination, request.stops, request.mode);
                if (seq !== routeSeqRef.current) return; // superseded by a newer request

                setDirectionsRoutes(routes);
                setRouteError(null);

                if (bookingStatus === 'idle') {
                    setDistance(routes[0].distance / 1000);
                    setDuration(routes[0].duration / 60);
                } else if (bookingStatus === 'confirmed') {
                    // When confirmed, this route is Driver -> Pickup
                    setDriverDuration(routes[0].duration / 60);
                }

                const isFollowing = currentOrder?.status === 'in_progress' || currentOrder?.status === 'picked_up';
                if (mapRef.current && !isFollowing) {
                    mapRef.current.fitToCoordinates(routes[0].coordinates, {
                        edgePadding: { top: 50, right: 50, bottom: 350, left: 50 },
                        animated: true,
                    });
                }
            } catch (error) {
                if (seq !== routeSeqRef.current) return;
                // Surface the real reason (key denied, no route, offline) instead of an empty map.
                // The code lets shouldRefetchRoute() skip retries that cannot succeed (ZERO_RESULTS, key denied).
                routeRequestRef.current = {
                    request, at: Date.now(), failed: true, failureCode: isRoutingError(error) ? error.code : undefined,
                };
                setDirectionsRoutes([]);
                setRouteError(error);
            }
        };

        fetchRoutes();
    }, [bookingStatus, assignedDriver, pickupLocation, dropoffLocation, stops, selectedVehicle, currentOrder?.status]);

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            setPromoError('กรุณากรอกรหัสส่วนลด');
            return;
        }

        setIsApplyingPromo(true);
        setPromoError('');

        try {
            const res = await api.validatePromo({ code: promoCode, order_value: price });
            setAppliedPromo(res);
            setPromoCode('');
        } catch (e: any) {
            setPromoError(e.message || 'รหัสส่วนลดไม่ถูกต้อง');
            setAppliedPromo(null);
        } finally {
            setIsApplyingPromo(false);
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
    }

    // Book at `quotedPrice` = the fare the customer has just seen. The server re-prices the trip and answers 409
    // when its fare for this vehicle type is more than 10 THB higher; that path re-estimates and asks again.
    const submitBooking = async (quotedPrice: number) => {
        if (!pickupLocation || !dropoffLocation || !selectedVehicle) return;
        if (!user?.id) {
            Alert.alert('Error', 'Please login to book a ride');
            return;
        }
        if (quotedPrice <= 0 || priceError) return; // the button is disabled in this state; guard the 409 re-submit too
        if (paymentMethod === 'wallet' && walletBalance < quotedPrice) {
            Alert.alert(
                'ยอดเงินคงเหลือไม่พอ',
                `คุณมียอดเงินในวอลเล็ทไม่เพียงพอ (คงเหลือ ฿${formatPrice(walletBalance)}) กรุณาเติมเงินก่อนดำเนินการจอง`,
                [
                    { text: 'ยกเลิก', style: 'cancel' },
                    { text: 'เติมเงิน', onPress: () => router.push('/(customer)/(tabs)/wallet') }
                ]
            );
            return;
        }

        setBookingStatus('searching');

        try {
            // Create order via API
            const petIdsStr = params.petIds as string;
            const petIds = petIdsStr ? petIdsStr.split(',') : [];
            const primaryPetId = petIds.length > 0 ? Number(petIds[0]) : 1;

            const order = await orderService.createOrder({
                user_id: user.id,
                pet_id: primaryPetId,
                pickup_address: pickupLocation.name || pickupLocation.address || 'Pickup',
                pickup_lat: pickupLocation.latitude,
                pickup_lng: pickupLocation.longitude,
                dropoff_address: dropoffLocation.name || dropoffLocation.address || 'Dropoff',
                dropoff_lat: dropoffLocation.latitude,
                dropoff_lng: dropoffLocation.longitude,
                price: quotedPrice, // the quote the customer saw; the server compares it with its own fare
                vehicle_type: selectedVehicle.id, // so the server prices this type instead of guessing it from the quote
                status: 'pending',
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cash' ? 'pending' : 'pending', // Both pending initially
                stripe_payment_method_id: paymentMethod === 'stripe' ? savedCards[0]?.id : undefined,
                passengers: passengers,
                pet_ids: petIds.map(Number), // Send all pet IDs
                pet_details: displayPetNames,
                is_round_trip: isRoundTrip,
                return_time: isRoundTrip ? (returnOption === 'immediate' ? 'รอรับกลับทันที' : returnTimeText) : undefined,
                promo_code: appliedPromo?.code,
                discount_amount: appliedPromo?.discount_amount,
                stops: stops.map((s, i) => ({
                    address: s.address || s.name || 'Stop',
                    lat: s.latitude,
                    lng: s.longitude,
                    order_index: i
                }))
            });

            // Create initial payment record for what the server stored on the order (its fare minus any promo it
            // applied) - not the app's quote, which is only a comparison input. `price` arrives as a Decimal string.
            const serverPrice = order.price == null ? NaN : Number(order.price);
            await api.createPayment({
                order_id: order.id,
                amount: Number.isFinite(serverPrice) && serverPrice >= 0 ? serverPrice : quotedPrice,
                method: paymentMethod,
                status: 'pending'
            });

            setCurrentOrder(order);
            console.log('Order created:', order.id);

            const startSharingLocation = async (orderId: number) => {
                if (shareLocationIntervalRef.current) clearInterval(shareLocationIntervalRef.current);
                shareLocationIntervalRef.current = setInterval(async () => {
                    try {
                        const { status } = await Location.requestForegroundPermissionsAsync();
                        if (status !== 'granted') return;
                        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        await orderService.updateCustomerLocation(orderId, location.coords.latitude, location.coords.longitude);
                    } catch (error) {
                        console.error('Error sharing customer location:', error);
                    }
                }, 5000);
            };

            const stopSharingLocation = () => {
                if (shareLocationIntervalRef.current) {
                    clearInterval(shareLocationIntervalRef.current);
                    shareLocationIntervalRef.current = null;
                }
            };

            // Poll for order updates (acceptance, arrival, journey, completion)
            pollIntervalRef.current = setInterval(async () => {
                try {
                    const updatedOrder = await orderService.getOrder(order.id);
                    console.log('Polling order status:', updatedOrder.status, 'driver_id:', updatedOrder.driver_id);

                    // 1. Detect Status Change for Notifications
                    if (prevStatusRef.current && prevStatusRef.current !== updatedOrder.status) {
                        if (updatedOrder.status === 'arrived') {
                            Alert.alert("Driver Arrived!", "Your driver has arrived at the pickup location. Please meet them at the pickup point.");
                        } else if (updatedOrder.status === 'accepted') {
                            startSharingLocation(order.id);
                        } else if (updatedOrder.status === 'in_progress') {
                            stopSharingLocation();
                            Alert.alert("Journey Started", "The journey has begun. Your pet is safely on the way!");
                        } else if (updatedOrder.status === 'completed') {
                            stopSharingLocation();
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

                            if (paymentMethod === 'stripe' && updatedOrder.payment_status !== 'paid') {
                                // For Stripe, go to payment screen (where we will try auto-charge)
                                setBookingStatus('idle');
                                setCurrentOrder(null);
                                setAssignedDriver(null);
                                clearBooking();
                                router.replace(`/(customer)/payment/${order.id}`);
                            } else {
                                // Auto redirect without alert
                                stopSharingLocation();
                                setBookingStatus('idle');
                                setCurrentOrder(null);
                                setAssignedDriver(null);
                                clearBooking();
                                router.replace(`/(customer)/payment-summary/${order.id}`);
                            }
                        } else if (updatedOrder.status === 'cancelled') {
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            stopSharingLocation();
                            Alert.alert("Booking Cancelled", "This booking has been cancelled by the driver.", [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        setBookingStatus('idle');
                                        setCurrentOrder(null);
                                        setAssignedDriver(null);
                                        clearBooking();
                                        router.replace('/(customer)/(tabs)/home');
                                    }
                                }
                            ]);
                        }
                    }
                    prevStatusRef.current = updatedOrder.status;
                    setCurrentOrder(updatedOrder);

                    // 2. Handle Driver Location & Navigation
                    if (updatedOrder.driver_id) {
                        const currentDrivers = driverLocationsRef.current;
                        const driverLoc = currentDrivers.find(d => d.driver?.id === updatedOrder.driver_id);

                        if (driverLoc) {
                            setAssignedDriver(driverLoc);

                            // 2.a Handle Navigation/Follow Mode (Always if driver assigned and job active)
                            const isActive = ['accepted', 'arrived', 'picked_up', 'in_progress'].includes(updatedOrder.status);
                            if (isActive && mapRef.current) {
                                mapRef.current.animateCamera({
                                    center: {
                                        latitude: driverLoc.lat,
                                        longitude: driverLoc.lng,
                                    },
                                    pitch: 45,
                                    heading: 0,
                                    altitude: 500,
                                    zoom: 17
                                }, { duration: 2000 });
                            }

                            // 2.b Handle First-time Acceptance (Shift Map)
                            if (bookingStatusRef.current === 'searching' && updatedOrder.status === 'accepted') {
                                if (mapRef.current) {
                                    mapRef.current.fitToCoordinates([
                                        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
                                        { latitude: driverLoc.lat, longitude: driverLoc.lng }
                                    ], {
                                        edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
                                        animated: true
                                    });
                                }
                                setBookingStatus('confirmed');
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error polling order:', err);
                }
            }, 3000); // Poll every 3 seconds

            // Stop polling after 5 minutes ONLY if still searching
            setTimeout(() => {
                if (bookingStatusRef.current === 'searching') {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setBookingStatus('idle');
                    Alert.alert('No driver found', 'Please try again later.', [
                        { text: 'OK', onPress: () => router.replace('/(customer)/(tabs)/home') }
                    ]);
                }
            }, 300000);

        } catch (error: unknown) {
            console.error('Failed to create order:', error);
            setBookingStatus('idle');
            if (isApiError(error) && error.status === 409) {
                // The server's fare is above the quote: refresh the price and let the customer decide
                await handlePriceConflict(quotedPrice);
                return;
            }
            if (isApiError(error) && error.status === 401) {
                // Session expired between the estimate and the booking: clear it, the app returns to login
                await useAuthStore.getState().logout();
                return;
            }
            Alert.alert(t('booking_failed_title'), errorDetail(error) || t('booking_failed_generic'));
        }
    };

    // POST /orders/ answered 409 ("Price changed ..."): re-estimate, show the new fare and book only once the
    // customer agrees to it. Nothing is ever booked at a price the customer has not seen.
    const handlePriceConflict = async (quotedPrice: number) => {
        let fresh: PricingResponse | null;
        try {
            fresh = await fetchPrice();
        } catch (error) {
            // priceError is set and the button disabled; say why the price could not be refreshed
            Alert.alert(t('price_changed_title'), t('price_changed_refresh_failed', { detail: errorDetail(error) }));
            return;
        }
        if (!fresh) return;
        const newPrice = fresh.estimated_price;
        Alert.alert(
            t('price_changed_title'),
            t('price_changed_message', { newPrice: formatPrice(newPrice), oldPrice: formatPrice(quotedPrice) }),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('price_changed_confirm', { newPrice: formatPrice(newPrice) }), onPress: () => { submitBooking(newPrice); } },
            ]
        );
    };

    const handleBook = () => { submitBooking(price); };

    const handleCancelOrder = async () => {
        if (!currentOrder) return;

        Alert.alert(
            "Cancel Order",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setIsCancelling(true);
                        try {
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            if (shareLocationIntervalRef.current) clearInterval(shareLocationIntervalRef.current);
                            await orderService.cancelOrder(currentOrder.id);

                            // Reset state
                            setBookingStatus('idle');
                            setCurrentOrder(null);
                            setAssignedDriver(null);
                            clearBooking();
                            router.replace('/(customer)/(tabs)/home');

                            // Adjust map back to pickup/dropoff
                            if (mapRef.current && pickupLocation && dropoffLocation) {
                                mapRef.current.fitToCoordinates([
                                    { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
                                    { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude }
                                ], {
                                    edgePadding: { top: 50, right: 50, bottom: 590, left: 50 },
                                    animated: true,
                                });
                            }
                        } catch (error) {
                            console.error('Failed to cancel order:', error);
                            Alert.alert("Error", "Failed to cancel order. Please try again.");
                        } finally {
                            setIsCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    const initialRegion = pickupLocation ? {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : {
        latitude: 13.7563,
        longitude: 100.5018,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    }


    const handleMapReady = () => {
        if (!mapRef.current || !pickupLocation || !dropoffLocation) return;

        mapRef.current.fitToCoordinates([
            { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
            { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude },
        ], {
            edgePadding: { top: 50, right: 50, bottom: 590, left: 50 },
            animated: true,
        });
    };

    return (
        <View className="flex-1 bg-white">
            {/* Full Screen Map */}
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-200">
                <AppMapView
                    ref={mapRef}

                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1 }}
                    initialRegion={initialRegion}
                    onMapReady={handleMapReady}
                >
                    {pickupLocation && dropoffLocation && (
                        <>
                            {/* Pickup Marker - Always show if idle, or as Destination if confirmed */}
                            {(pickupLocation && (bookingStatus === 'idle' || bookingStatus === 'confirmed')) && (
                                <Marker
                                    coordinate={{ latitude: pickupLocation.latitude, longitude: pickupLocation.longitude }}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View className="bg-white p-1 rounded-full border border-blue-500 shadow-sm">
                                        <View className="w-2 h-2 bg-blue-500 rounded-full" />
                                    </View>
                                </Marker>
                            )}

                            {/* Dropoff Marker - Hide if Driver is approaching (confirmed) */}
                            {(dropoffLocation && bookingStatus === 'idle') && (
                                <Marker
                                    coordinate={{ latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude }}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View className="bg-white p-1 rounded-full border border-red-500 shadow-sm">
                                        <View className="w-2 h-2 bg-red-500 rounded-full" />
                                    </View>
                                </Marker>
                            )}

                            {/* Stops Markers */}
                            {bookingStatus === 'idle' && stops.map((stop, index) => (
                                <Marker
                                    key={`stop-${index}`}
                                    coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View className="bg-white p-1 rounded-full border border-orange-400 shadow-sm">
                                        <View className="w-2 h-2 bg-orange-400 rounded-full" />
                                    </View>
                                </Marker>
                            ))}
                            {(routeOrigin && routeDestination) && (
                                <>
                                    {displayedSegments.length > 0 ? (
                                        displayedSegments.map((segment, index) => (
                                            <Polyline
                                                key={`route-segment-${index}`}
                                                coordinates={segment.coordinates}
                                                strokeColor={segment.color}
                                                strokeWidth={10}
                                                lineCap="round"
                                                lineJoin="round"
                                                zIndex={10}
                                            />
                                        ))
                                    ) : (
                                        directionsRoutes.length > 0 && (
                                            <Polyline
                                                coordinates={directionsRoutes[0].coordinates}
                                                strokeColor="#3B82F6"
                                                strokeWidth={5}
                                                zIndex={10}
                                            />
                                        )
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Driver Markers */}
                    {driverLocations
                        .filter(driver => {
                            // Filter by vehicle type
                            // Always show assigned driver
                            if (currentOrder?.driver_id && driver.driver?.id === currentOrder.driver_id) {
                                return true;
                            }

                            if (!selectedVehicle || driver.driver?.vehicle_type !== selectedVehicle.id) {
                                return false;
                            }

                            // Filter by distance - only show drivers within 2km radius
                            if (pickupLocation) {
                                const distance = getDistance(
                                    pickupLocation.latitude,
                                    pickupLocation.longitude,
                                    driver.lat,
                                    driver.lng
                                );
                                return distance <= 2; // 2 kilometers radius
                            }

                            return true; // If no pickup location, show all (fallback)
                        })
                        .map((driver) => (
                            <Marker
                                key={`driver-${driver.id}`}
                                coordinate={{ latitude: driver.lat, longitude: driver.lng }}
                                title={driver.driver?.full_name || t('driver')}
                                description={`Plate: ${driver.driver?.vehicle_plate || '-'}`}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <PetGoCarIcon width={24} height={48} />
                            </Marker>
                        ))}
                </AppMapView>

                <RouteErrorBanner error={routeError} />

                {/* Back Button Overlay */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-5 bg-white p-2 rounded-full shadow-sm z-10"
                >
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Bottom Sheet Content */}
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
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}
            >
                {/* Drag Handle */}
                <View
                    {...panResponder.panHandlers}
                    className="w-full items-center pt-3 pb-2 bg-white rounded-t-3xl"
                >
                    <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </View>

                {bookingStatus === 'idle' && (
                    <ScrollView
                        className="flex-1 px-5"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
                    >

                        {/* Header Info */}
                        <View className="flex-row justify-between items-center mb-6 pt-2">
                            <View>
                                <Text className="text-2xl font-bold text-gray-900">
                                    {t('confirm_booking')}
                                </Text>
                                <Text className="text-gray-500">
                                    {`${distance.toFixed(1)} km • ${Math.ceil(duration)} min`}
                                </Text>
                            </View>
                            <View className="bg-green-100 px-3 py-1 rounded-lg min-w-[80px] items-center">
                                {loadingPrice ? (
                                    <Text className="text-green-700 font-bold text-lg">...</Text>
                                ) : (
                                    <Text className="text-green-700 font-bold text-lg">฿{formatPrice(price)}</Text>
                                )}
                            </View>
                        </View>

                        {/* Route Details */}
                        <View className="mb-6 space-y-4">
                            <View className="flex-row items-start">
                                <View className="w-8 items-center mr-3">
                                    <View className="w-3 h-3 bg-blue-500 rounded-full" />
                                    <View className="w-0.5 min-h-[40px] bg-gray-200 my-1" />
                                    {stops.length > 0 && (
                                        <>
                                            {stops.map((_, i) => (
                                                <React.Fragment key={`line-${i}`}>
                                                    <View className="w-3 h-3 bg-orange-400 rounded-full" />
                                                    <View className="w-0.5 min-h-[40px] bg-gray-200 my-1" />
                                                </React.Fragment>
                                            ))}
                                        </>
                                    )}
                                    <View className="w-3 h-3 bg-red-500 rounded-sm" />
                                </View>
                                <View className="flex-1 space-y-4">
                                    <View>
                                        <Text className="text-gray-500 text-[10px] uppercase mb-1">{t('pick_up')}</Text>
                                        <Text className="font-semibold text-gray-800" numberOfLines={1}>{pickupLocation?.name}</Text>
                                        <Text className="text-gray-500 text-xs" numberOfLines={1}>{pickupLocation?.address}</Text>
                                    </View>

                                    {stops.map((stop, index) => (
                                        <View key={`stop-summary-${index}`}>
                                            <Text className="text-gray-500 text-[10px] uppercase mb-1">{t('stop') || 'Stop'} {index + 1}</Text>
                                            <Text className="font-semibold text-gray-800" numberOfLines={1}>{stop.name || stop.address}</Text>
                                            <Text className="text-gray-500 text-xs" numberOfLines={1}>{stop.address}</Text>
                                        </View>
                                    ))}

                                    <View>
                                        <Text className="text-gray-500 text-[10px] uppercase mb-1">{t('drop_off')}</Text>
                                        <Text className="font-semibold text-gray-800" numberOfLines={1}>{dropoffLocation?.name}</Text>
                                        <Text className="text-gray-500 text-xs" numberOfLines={1}>{dropoffLocation?.address}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Trip Details (Pets & Passengers) */}
                        <View className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <Text className="font-bold text-gray-800 mb-2">Trip Details</Text>

                            <View className="flex-row items-center mb-2">
                                <PawPrint size={16} color="#4B5563" />
                                <Text className="ml-2 text-gray-600 font-medium">
                                    Pets: <Text className="text-gray-900">{displayPetNames}</Text>
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <User size={16} color="#4B5563" />
                                <Text className="ml-2 text-gray-600 font-medium">
                                    Passengers: <Text className="text-gray-900">{passengers}</Text>
                                </Text>
                            </View>
                        </View>


                        {/* Round Trip Selection */}
                        <View className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                                        <Text className="text-xl">🔁</Text>
                                    </View>
                                    <View>
                                        <Text className="font-bold text-gray-800 text-base">จองไป-กลับ (Round-Trip)</Text>
                                        <Text className="text-xs text-gray-500 mt-0.5 w-[200px]">คนขับจะรอรับกลับที่จุดหมายปลายทาง</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={isRoundTrip}
                                    onValueChange={setIsRoundTrip}
                                    trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
                                    thumbColor={isRoundTrip ? '#3B82F6' : '#9CA3AF'}
                                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                                />
                            </View>

                            {isRoundTrip && (
                                <View className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <Text className="text-sm font-semibold text-gray-700 mb-3">เวลากลับ (Return Time)</Text>

                                    <View className="flex-row gap-3 mb-3">
                                        <TouchableOpacity
                                            className={`flex-1 py-2 rounded-lg border flex-row justify-center items-center ${returnOption === 'immediate'
                                                ? 'bg-blue-50 border-blue-500'
                                                : 'bg-white border-gray-200'
                                                }`}
                                            onPress={() => setReturnOption('immediate')}
                                        >
                                            {returnOption === 'immediate' && <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />}
                                            <Text className={`text-sm ${returnOption === 'immediate' ? 'text-blue-700 font-bold' : 'text-gray-600 font-medium'}`}>
                                                รับกลับทันที (Immediate)
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className={`flex-1 py-2 rounded-lg border flex-row justify-center items-center ${returnOption === 'time'
                                                ? 'bg-blue-50 border-blue-500'
                                                : 'bg-white border-gray-200'
                                                }`}
                                            onPress={() => setReturnOption('time')}
                                        >
                                            {returnOption === 'time' && <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />}
                                            <Text className={`text-sm ${returnOption === 'time' ? 'text-blue-700 font-bold' : 'text-gray-600 font-medium'}`}>
                                                ระบุเวลา (Specify Time)
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {returnOption === 'time' && (
                                        <TextInput
                                            className="w-full bg-white px-4 py-3 rounded-lg border border-gray-200 text-gray-800 mt-1"
                                            placeholder="เช่น 14:30 หรือ รอ 2 ชั่วโมง"
                                            value={returnTimeText}
                                            onChangeText={setReturnTimeText}
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Vehicle Selection */}
                        <Text className="text-lg font-bold mb-3 text-gray-900">{t('choose_vehicle')}</Text>
                        {loadingVehicles ? (
                            <ActivityIndicator size="large" color="#0000ff" className="mb-6" />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                {vehicles.map((vehicle) => (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        onPress={() => setSelectedVehicle(vehicle)}
                                        className={`mr-4 p-4 rounded-xl border-2 w-40 ${selectedVehicle?.id === vehicle.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white'
                                            }`}
                                    >
                                        {/* Image Placeholder */}
                                        <View className="h-20 w-full mb-2 bg-gray-50 rounded-lg justify-center items-center overflow-hidden">
                                            {(vehicle.image && (vehicle.image.startsWith('http') || vehicle.image.startsWith('file'))) ? (
                                                <Image
                                                    source={{ uri: vehicle.image }}
                                                    className="w-full h-full"
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <View className="items-center">
                                                    {vehicle.id === 'motorcycle' || vehicle.id === 'bike' ? <Bike size={32} color="#4B5563" /> :
                                                        vehicle.id === 'van' || vehicle.id === 'truck' ? <Truck size={32} color="#4B5563" /> :
                                                            <Car size={32} color="#4B5563" />}
                                                </View>
                                            )}
                                        </View>
                                        <Text className="font-bold text-gray-800">{vehicle.name}</Text>
                                        <Text className="text-primary font-bold">
                                            ฿{selectedVehicle?.id === vehicle.id && !loadingPrice
                                                ? (priceError ? '—' : formatPrice(price))
                                                : formatPrice(Math.max(vehicle.minPrice || 0, Math.round(((vehicle.basePrice + (distance * vehicle.perKmRate) + (duration * (vehicle.perMinRate || 0))) * surgeMultiplier) + weightSurcharge)))
                                            }
                                        </Text>
                                        <Text className="text-xs text-gray-500">+{t('pet_surcharge') || 'Pet'}: ฿{formatPrice(weightSurcharge)}</Text>
                                        {/* <Text className="text-xs text-gray-500">pet weight: {petWeight}</Text> */}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Payment Method Selection */}
                        <Text className="text-lg font-bold mb-3 text-gray-900">{t('payment_method')}</Text>
                        <View className="flex-row gap-4 mb-6 flex-wrap">
                            {paymentConfig.cash && (
                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('cash')}
                                    className={`flex-1 p-4 rounded-xl border-2 items-center flex-row ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
                                    style={{ minWidth: '45%' }}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${paymentMethod === 'cash' ? 'bg-primary' : 'bg-gray-100'}`}>
                                        <Wallet size={20} color={paymentMethod === 'cash' ? 'white' : 'gray'} />
                                    </View>
                                    <Text className={`font-semibold ${paymentMethod === 'cash' ? 'text-primary' : 'text-gray-500'}`}>{t('cash')}</Text>
                                </TouchableOpacity>
                            )}

                            {paymentConfig.promptpay && (
                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('promptpay')}
                                    className={`flex-1 p-4 rounded-xl border-2 items-center flex-row ${paymentMethod === 'promptpay' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
                                    style={{ minWidth: '45%' }}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${paymentMethod === 'promptpay' ? 'bg-primary' : 'bg-gray-100'}`}>
                                        <CreditCard size={20} color={paymentMethod === 'promptpay' ? 'white' : 'gray'} />
                                    </View>
                                    <Text className={`font-semibold ${paymentMethod === 'promptpay' ? 'text-primary' : 'text-gray-500'}`}>{t('promptpay')}</Text>
                                </TouchableOpacity>
                            )}

                            {paymentConfig.wallet && (
                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('wallet')}
                                    className={`flex-1 p-4 rounded-xl border-2 items-center flex-row ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
                                    style={{ minWidth: '45%' }}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${paymentMethod === 'wallet' ? 'bg-primary' : 'bg-gray-100'}`}>
                                        <Wallet size={20} color={paymentMethod === 'wallet' ? 'white' : 'gray'} />
                                    </View>
                                    <View>
                                        <Text className={`font-semibold ${paymentMethod === 'wallet' ? 'text-primary' : 'text-gray-500'}`}>วอลเล็ท</Text>
                                        <Text className={`text-[10px] ${walletBalance < price ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                            ฿{formatPrice(walletBalance)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {paymentConfig.stripe && (
                            <View className="flex-row gap-4 mb-6">
                                <TouchableOpacity
                                    onPress={() => {
                                        if (savedCards.length > 0) {
                                            setPaymentMethod('stripe');
                                        } else {
                                            router.push('/(customer)/payment-methods');
                                        }
                                    }}
                                    className={`flex-1 p-4 rounded-xl border-2 items-center flex-row ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${paymentMethod === 'stripe' ? 'bg-primary' : 'bg-gray-100'}`}>
                                        <CreditCard size={20} color={paymentMethod === 'stripe' ? 'white' : 'gray'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-semibold ${paymentMethod === 'stripe' ? 'text-primary' : 'text-gray-500'}`}>
                                            {savedCards.length > 0 ? 'บัตรเครดิต' : 'เพิ่มบัตรเครดิต'}
                                        </Text>
                                        {savedCards.length > 0 && (
                                            <Text className={`text-[10px] ${paymentMethod === 'stripe' ? 'text-primary/70' : 'text-gray-400'}`}>
                                                {savedCards[0].brand} •••• {savedCards[0].last4}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                <View className="flex-1" />
                            </View>
                        )}

                        {/* Promo Code Section */}
                        <View className="mb-6">
                            <Text className="text-lg font-bold mb-3 text-gray-900">Promo Code (ส่วนลด)</Text>
                            {appliedPromo ? (
                                <View className="bg-green-50 p-4 rounded-xl border border-green-200 flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                                            <Tag size={16} color="#16A34A" />
                                        </View>
                                        <View>
                                            <Text className="font-bold text-green-800">{appliedPromo.code}</Text>
                                            <Text className="text-sm text-green-600">ลด ฿{formatPrice(appliedPromo.discount_amount)}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={removePromo} className="p-2">
                                        <X size={20} color="#16A34A" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <View className="flex-row gap-3">
                                        <TextInput
                                            value={promoCode}
                                            onChangeText={(text) => { setPromoCode(text); setPromoError(''); }}
                                            placeholder="กรอกรหัสส่วนลด..."
                                            className="flex-1 bg-white px-4 py-4 rounded-xl border border-gray-200 text-gray-800 uppercase"
                                            placeholderTextColor="#9CA3AF"
                                            autoCapitalize="characters"
                                        />
                                        <TouchableOpacity
                                            onPress={handleApplyPromo}
                                            disabled={isApplyingPromo || !promoCode.trim()}
                                            className={`px-6 justify-center items-center rounded-xl ${(!promoCode.trim() || isApplyingPromo) ? 'bg-gray-200' : 'bg-gray-900'}`}
                                        >
                                            {isApplyingPromo ? (
                                                <ActivityIndicator color="gray" size="small" />
                                            ) : (
                                                <Text className={`font-bold ${!promoCode.trim() ? 'text-gray-400' : 'text-white'}`}>ใช้โค้ด</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    {promoError ? <Text className="text-red-500 text-sm mt-2 ml-1">{promoError}</Text> : null}
                                </View>
                            )}
                        </View>

                        <TextInput
                            placeholder="Note to driver (optional)"
                            value={note}
                            onChangeText={setNote}
                            className="flex-1 text-gray-800 font-medium bg-gray-50 p-4 rounded-xl mb-6"
                            placeholderTextColor="#9CA3AF"
                            style={{ paddingVertical: 8 }} // Ensure touch target
                        />
                        <View className="pt-2">
                            {/* Extra padding to prevent keyboard hiding */}
                        </View>
                    </ScrollView>
                )}

                {/* Fixed Footer within Bottom Sheet */}
                {bookingStatus === 'idle' && (
                    <View className="p-5 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-white">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">{t('service_fare') || 'Service Fare'}</Text>
                            <Text className="font-semibold text-gray-800">
                                {loadingPrice ? '...' : `฿${formatPrice(Math.round((price - weightSurcharge) / surgeMultiplier))}`}
                            </Text>
                        </View>

                        {surgeMultiplier > 1 && (
                            <View className="flex-row justify-between mb-2">
                                <View className="flex-1">
                                    <Text className="text-orange-600 font-medium">Surge pricing ({surgeMultiplier}x)</Text>
                                    <Text className="text-orange-400 text-xs">{surgeReasons.join(', ')}</Text>
                                </View>
                                <Text className="font-semibold text-orange-600">
                                    +฿{formatPrice(price - weightSurcharge - Math.round((price - weightSurcharge) / surgeMultiplier))}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">{t('weight_kg') || 'Pet weight'} ({petWeight.toFixed(1)}kg)</Text>
                            <Text className="font-semibold text-gray-800">
                                {loadingPrice ? '...' : (weightSurcharge > 0 ? `+฿${formatPrice(weightSurcharge)}` : 'Free')}
                            </Text>
                        </View>

                        {multiPetDiscount > 0 && (
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-green-600 font-medium">✨ Multi-Pet Savings</Text>
                                <Text className="font-semibold text-green-600">
                                    -฿{formatPrice(multiPetDiscount)}
                                </Text>
                            </View>
                        )}

                        {roundTripFee > 0 && (
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-500">Round Trip / Waiting Fee</Text>
                                <Text className="font-semibold text-gray-800">
                                    +฿{formatPrice(roundTripFee)}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">{t('payment_method')}</Text>
                            <Text className="font-semibold text-gray-800">
                                {paymentMethod === 'cash' ? t('cash') : paymentMethod === 'promptpay' ? t('promptpay') : paymentMethod === 'wallet' ? 'วอลเล็ท' : 'บัตรเครดิต'}
                            </Text>
                        </View>

                        {appliedPromo && (
                            <View className="flex-row justify-between mb-2 mt-2 pt-2 border-t border-gray-100">
                                <Text className="text-green-600 font-medium">ส่วนลด (Promo: {appliedPromo.code})</Text>
                                <Text className="font-semibold text-green-600">
                                    -฿{formatPrice(appliedPromo.discount_amount)}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between mb-6 mt-2 pt-2 border-t border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">Total</Text>
                            {loadingPrice ? (
                                <Text className="text-2xl font-bold text-primary">Loading...</Text>
                            ) : priceError ? (
                                <Text className="text-2xl font-bold text-gray-400">—</Text>
                            ) : (
                                <Text className="text-2xl font-bold text-primary">฿{formatPrice(appliedPromo ? price - appliedPromo.discount_amount : price)}</Text>
                            )}
                        </View>
                        {priceError && (
                            <View className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                                <Text className="text-red-700 font-medium">{t('price_unavailable')}</Text>
                                <Text className="text-red-500 text-xs mt-1">{priceError}</Text>
                                <TouchableOpacity
                                    onPress={() => { fetchPrice().catch(() => { /* shown via priceError */ }); }}
                                    className="mt-2 self-start"
                                >
                                    <Text className="text-primary font-bold">{t('retry')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <AppButton
                            className="mb-10"
                            title={t('confirm_booking')}
                            onPress={handleBook}
                            size="lg"
                            disabled={loadingPrice || price <= 0 || !!priceError}
                        />
                    </View>
                )}

                {bookingStatus === 'searching' && (
                    <View className="p-8 items-center bg-white" style={{ paddingBottom: insets.bottom + 10 }}>
                        <ActivityIndicator size="large" color="#00A862" className="mb-4" />
                        <Text className="text-lg font-bold text-gray-800">{t('finding_driver')}</Text>
                        <Text className="text-gray-500 mt-2 text-center mb-6">{t('connecting_nearest', { vehicle: selectedVehicle?.name })}</Text>

                        <AppButton
                            title={isCancelling ? t('cancelling') : t('cancel_order')}
                            variant="secondary"
                            onPress={handleCancelOrder}
                            disabled={isCancelling}
                            className="w-full bg-gray-100"
                            textClassName="text-gray-600"
                        />
                    </View>
                )}

                {bookingStatus === 'confirmed' && assignedDriver && (
                    <View className="p-5 border-t border-gray-100 bg-white" style={{ paddingBottom: insets.bottom + 10 }}>
                        <Text className="text-lg font-bold text-green-600 mb-4 text-center">
                            {currentOrder?.status === 'arrived' ? t('driver_arrived') :
                                (currentOrder?.status === 'in_progress' || currentOrder?.status === 'picked_up') ? t('heading_to_destination') :
                                    t('driver_found')}
                        </Text>

                        <View className="flex-row items-center mb-6">
                            <View className="w-16 h-16 bg-gray-200 rounded-full mr-4 items-center justify-center">
                                <Text className="text-2xl">👨‍✈️</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900">{assignedDriver.driver?.full_name || currentOrder?.driver?.full_name}</Text>
                                <View className="flex-row items-center mt-1">
                                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                                    <Text className="text-sm font-semibold ml-1">4.9</Text>
                                    <Text className="text-xs text-gray-400 ml-1">(120 jobs)</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                {assignedDriver.driver?.vehicle_image ? (
                                    <Image
                                        source={{ uri: assignedDriver.driver.vehicle_image }}
                                        className="w-16 h-10 mb-1 rounded-md"
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View className="w-16 h-10 mb-1 bg-gray-100 rounded-md items-center justify-center">
                                        <Car size={20} color="#9CA3AF" />
                                    </View>
                                )}
                                <Text className="font-bold text-lg text-gray-800">{assignedDriver.driver?.vehicle_plate}</Text>
                                <Text className="text-xs text-gray-500">{assignedDriver.driver?.vehicle_type}</Text>
                            </View>
                        </View>

                        <View className="flex-row space-x-3 mb-4">
                            <TouchableOpacity
                                className="flex-1 bg-green-500 py-3 rounded-xl flex-row justify-center items-center"
                                onPress={async () => {
                                    // The location feed is PII-free (DriverPublicOut); the phone comes from the order's driver.
                                    const driverPhone = currentOrder?.driver?.phone;
                                    if (driverPhone) {
                                        const url = `tel:${driverPhone}`;
                                        try {
                                            const canOpen = await Linking.canOpenURL(url);
                                            if (canOpen) {
                                                Linking.openURL(url);
                                            } else {
                                                Alert.alert(t('call'), `${t('driver')}: ${driverPhone}`);
                                            }
                                        } catch (error) {
                                            // Fallback for simulators or missing Info.plist config
                                            Alert.alert(t('call'), `${t('driver')}: ${driverPhone}`);
                                        }
                                    } else {
                                        Alert.alert(t('error'), t('phone_not_available'));
                                    }
                                }}
                            >
                                <Phone size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold">{t('call')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-blue-100 py-3 rounded-xl flex-row justify-center items-center"
                                onPress={() => router.push(`/(customer)/chat/${currentOrder?.id || 1}`)}
                            >
                                <MessageCircle size={20} color="#2563EB" className="mr-2" />
                                <Text className="text-blue-600 font-bold">{t('chat')}</Text>
                            </TouchableOpacity>
                        </View>

                        {(currentOrder?.status === 'in_progress' || currentOrder?.status === 'picked_up' || currentOrder?.status === 'completed') && currentOrder?.payment_status !== 'paid' && (
                            <TouchableOpacity
                                className={`w-full py-4 rounded-xl flex-row justify-center items-center mb-4 ${(paymentMethod === 'cash' && currentOrder?.status !== 'completed')
                                    ? 'bg-gray-400'
                                    : 'bg-blue-600'
                                    }`}
                                onPress={() => router.push(`/(customer)/payment/${currentOrder?.id}`)}
                                disabled={paymentMethod === 'cash' && currentOrder?.status !== 'completed'}
                            >
                                <CreditCard size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">
                                    {paymentMethod === 'cash' && currentOrder?.status !== 'completed'
                                        ? t('pay_at_destination_cash')
                                        : `${t('pay_now')} (฿${formatPrice(price)})`}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {(currentOrder?.status === 'accepted' || currentOrder?.status === 'pending') && (
                            <AppButton
                                title={t('cancel_booking')}
                                onPress={async () => {
                                    if (currentOrder) {
                                        console.log(`Canceling order ${currentOrder.id}`);
                                        try {
                                            await orderService.cancelOrder(currentOrder.id, assignedDriver?.driver?.id);
                                            setBookingStatus('idle');
                                            setCurrentOrder(null);
                                            setAssignedDriver(null);
                                            clearBooking();
                                            Alert.alert(t('booking_cancelled'), t('booking_cancelled_desc'), [
                                                { text: t('confirm'), onPress: () => router.replace('/(customer)/(tabs)/home') }
                                            ]);
                                        } catch (error) {
                                            Alert.alert(t('error'), 'Failed to cancel booking');
                                        }
                                    } else {
                                        setBookingStatus('idle');
                                        router.replace('/(customer)/(tabs)/home');
                                    }
                                }}
                                variant="outline"
                                size="sm"
                            />
                        )}
                    </View>
                )
                }

            </Animated.View>
        </View>
    );
}
