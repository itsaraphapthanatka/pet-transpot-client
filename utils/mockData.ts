export interface RideOption {
    id: string;
    name: string;
    price: number;
    image: string;
    duration: number;
    description: string;
}

export const MOCK_RIDE_OPTIONS: RideOption[] = [
    {
        id: 'car',
        name: 'Pet Car',
        price: 120,
        image: 'car',
        duration: 25,
        description: 'Comfy for medium pets',
    },
    {
        id: 'suv',
        name: 'Pet SUV',
        price: 250,
        image: 'suv',
        duration: 30,
        description: 'Premium & Spacious',
    },
    {
        id: 'van',
        name: 'Pet Van',
        price: 350,
        image: 'van',
        duration: 35,
        description: 'For large breed/multiple pets',
    },
];

export const MOCK_HISTORY = [
    {
        id: '1',
        date: '2023-10-25',
        from: 'Siam Paragon',
        to: 'Thong Lor Pet Hospital',
        price: 150,
        status: 'completed',
        vehicle: 'Pet Car',
    },
    {
        id: '2',
        date: '2023-10-20',
        from: 'Home',
        to: 'Central World',
        price: 80,
        status: 'completed',
        vehicle: 'Pet Bike',
    },
];
