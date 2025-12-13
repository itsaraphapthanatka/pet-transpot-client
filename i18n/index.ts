import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
    en: {
        translation: {
            welcome: "Welcome to Pet Transport",
            login: "Login",
            register: "Register",
            home: "Home",
            profile: "Profile",
            activity: "Activity",
            wallet: "Wallet",
            where_to: "Where to?",
            choose_vehicle: "Choose Vehicle",
            confirm: "Confirm",
            onboarding: {
                slide1_title: "Safe Transport for your Buddy",
                slide1_subtitle: "Professional drivers trained to handle pets with care and love.",
                slide2_title: "Real-time Tracking",
                slide2_subtitle: "Watch your pet's journey live on the map for peace of mind.",
                slide3_title: "Any Pet, Any Size",
                slide3_subtitle: "From hamsters to Great Danes, we have the right vehicle for you.",
                skip: "Skip",
                next: "Next",
                get_started: "Get Started"
            },
            login_screen: {
                title: "Login",
                subtitle: "Login to your account",
                email: "Email",
                password: "Password",
                login_as_customer: "Login as Customer",
                driver: "Driver",
                admin: "Admin",
                dont_have_account: "Don't have an account?",
                sign_up: "Sign Up",
                forgot_password: "Forgot Password",
            },
            home_screen: {
                good_morning: "Good Morning,",
                transport_safely: "Transport your pet safely",
                guest: "Guest"
            }
        }
    },
    th: {
        translation: {
            welcome: "ยินดีต้อนรับสู่ Pet Transport",
            onboarding: {
                slide1_title: "ขนส่งสัตว์เลี้ยงของคุณอย่างปลอดภัย",
                slide1_subtitle: "ผู้ขับขี่ที่ได้รับการฝึกอบรมเพื่อให้สัตว์เลี้ยงของคุณได้รับการดูแลอย่างดี",
                slide2_title: "ติดตามสัตว์เลี้ยงของคุณอย่างต่อเนื่อง",
                slide2_subtitle: "ดูสัตว์เลี้ยงของคุณอย่างต่อเนื่องบนแผนที่",
                slide3_title: "สัตว์เลี้ยงของคุณสามารถมีขนาดต่างๆ",
                slide3_subtitle: "จากแฮมสเตอร์ส์ถึง Great Danes, เรามีรถที่เหมาะสมสำหรับคุณ  ",
                skip: "ข้าม",
                next: "ต่อไป",
                get_started: "เริ่มต้น"
            },
            login_screen: {
                title: "เข้าสู่ระบบ",
                subtitle: "เข้าสู่ระบบบัญชีของคุณ",
                email: "อีเมล",
                password: "รหัสผ่าน",
                login_as_customer: "เข้าสู่ระบบลูกค้า",
                driver: "คนขับ",
                admin: "แอดมิน",
                dont_have_account: "ยังไม่มีบัญชี?",
                sign_up: "ลงทะเบียน",
                forgot_password: "ลืมรหัสผ่าน?",
            },
            home_screen: {
                good_morning: "สวัสดีตอนเช้า,",
                transport_safely: "ขนส่งสัตว์เลี้ยงของคุณอย่างปลอดภัย",
                guest: "แขก"
            }
        }
    }
};


import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageDetectorAsyncModule } from 'i18next';

const languageDetector: LanguageDetectorAsyncModule = {
    type: 'languageDetector',
    async: true,
    detect: (callback: (lang: string) => void) => {
        AsyncStorage.getItem('user-language').then((savedLanguage) => {
            const phoneLanguage = Localization.getLocales()[0].languageCode;
            callback(savedLanguage || phoneLanguage || 'th');
        }).catch((error) => {
            console.log('Error reading language', error);
            callback('th');
        });
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);
            console.log('Language saved:', language);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false // Handle loading manually if needed, or use Suspense
        }
    });

export default i18n;
