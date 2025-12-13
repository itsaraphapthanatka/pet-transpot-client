import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '../../utils/cn';

interface AppButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
    isLoading?: boolean;
    className?: string;
    textClassName?: string;
    icon?: React.ReactNode;
}

export const AppButton = ({
    title,
    variant = 'primary',
    size = 'default',
    isLoading,
    className,
    textClassName,
    icon,
    ...props
}: AppButtonProps) => {
    const baseStyles = "w-full rounded-full flex-row justify-center items-center";

    const variants = {
        primary: "bg-primary active:bg-green-700",
        secondary: "bg-gray-100 active:bg-gray-200",
        outline: "border border-green-600 bg-transparent active:bg-green-50",
        ghost: "bg-transparent active:bg-gray-50",
    };

    const sizeVariants = {
        sm: "py-2 px-4",
        default: "py-3 px-6",
        lg: "py-4 px-8",
    };

    const textVariants = {
        primary: "text-white font-bold",
        secondary: "text-gray-800 font-bold",
        outline: "text-green-600 font-bold",
        ghost: "text-gray-600 font-semibold",
    };

    const textSizeVariants = {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
    };

    return (
        <TouchableOpacity
            className={cn(
                baseStyles,
                variants[variant],
                sizeVariants[size],
                props.disabled && "opacity-50",
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : 'green'} />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={cn(
                        textVariants[variant],
                        textSizeVariants[size],
                        textClassName
                    )}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};
