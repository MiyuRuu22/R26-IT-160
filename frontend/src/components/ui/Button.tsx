import React from 'react';
import { Text, Pressable, PressableProps, View } from 'react-native';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({ label, variant = 'primary', icon, className, textClassName, ...props }: ButtonProps) {
  const getStyle = () => {
    switch (variant) {
      case 'primary': return 'bg-ink';
      case 'secondary': return 'bg-transparent border border-ink';
      case 'accent': return 'bg-accent';
      default: return 'bg-ink';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return 'text-paper';
      case 'secondary': return 'text-ink';
      case 'accent': return 'text-white';
      default: return 'text-paper';
    }
  };

  return (
    <Pressable
      className={`flex-row items-center justify-center h-[42px] px-4 rounded-[4px] ${getStyle()} active:opacity-80 ${className || ''}`}
      {...props}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 13, letterSpacing: -0.1 }} className={`${getTextColor()} ${textClassName || ''}`}>{label}</Text>
    </Pressable>
  );
}
