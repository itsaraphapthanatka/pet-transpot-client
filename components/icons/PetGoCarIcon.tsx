import React from 'react';
import Svg, { Path, Ellipse, G, Defs, ClipPath, Rect } from 'react-native-svg';

interface CarIconProps {
    width?: number;
    height?: number;
}

export const PetGoCarIcon: React.FC<CarIconProps> = ({ width = 48, height = 48 }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 120 120" fill="none">
            {/* Shadow */}
            <Ellipse cx="60" cy="100" rx="30" ry="8" fill="#00000020" />

            {/* Car Body - Main */}
            <G>
                {/* Bottom part */}
                <Path
                    d="M 30 70 L 25 85 L 35 90 L 85 90 L 95 85 L 90 70 Z"
                    fill="#1BA1B5"
                />

                {/* Top part - Hood */}
                <Path
                    d="M 35 50 Q 40 40 60 40 Q 80 40 85 50 L 90 70 L 30 70 Z"
                    fill="#1BA1B5"
                />

                {/* Windshield */}
                <Path
                    d="M 42 52 Q 45 45 60 45 Q 75 45 78 52 L 82 68 L 38 68 Z"
                    fill="#A0E7F0"
                    opacity="0.7"
                />

                {/* Side Window */}
                <Path
                    d="M 70 55 L 78 55 L 82 68 L 72 68 Z"
                    fill="#A0E7F0"
                    opacity="0.7"
                />

                {/* Front Logo "S" */}
                <Path
                    d="M 50 60 Q 48 58 50 56 Q 52 54 54 56 Q 56 58 54 60 Q 52 62 50 60 Z"
                    fill="white"
                />
            </G>

            {/* Headlights */}
            <Ellipse cx="35" cy="48" rx="3" ry="4" fill="#2C3E50" />
            <Ellipse cx="85" cy="48" rx="3" ry="4" fill="#2C3E50" />

            {/* Wheels */}
            <G>
                {/* Front Wheel */}
                <Ellipse cx="75" cy="90" rx="10" ry="10" fill="#2C3E50" />
                <Ellipse cx="75" cy="90" rx="6" ry="6" fill="#95A5A6" />

                {/* Back Wheel */}
                <Ellipse cx="45" cy="90" rx="10" ry="10" fill="#2C3E50" />
                <Ellipse cx="45" cy="90" rx="6" ry="6" fill="#95A5A6" />
            </G>

            {/* PetGO Text */}
            <G>
                {/* P */}
                <Path d="M 50 72 L 50 82 M 50 72 L 54 72 Q 56 72 56 74 Q 56 76 54 76 L 50 76"
                    stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* e */}
                <Path d="M 58 78 Q 58 76 60 76 Q 62 76 62 78 Q 62 80 60 80 L 58 80"
                    stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* t */}
                <Path d="M 63 74 L 63 80 M 61 76 L 65 76"
                    stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* G */}
                <Path d="M 70 76 Q 68 76 68 78 Q 68 80 70 80 L 72 80 L 72 78"
                    stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* O */}
                <Path d="M 76 78 Q 76 76 78 76 Q 80 76 80 78 Q 80 80 78 80 Q 76 80 76 78"
                    stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </G>
        </Svg>
    );
};
