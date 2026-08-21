import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
}

export function Card({ children, className, elevated = false, ...props }: CardProps) {
  return (
    <View
      className={`bg-white border border-[#e0dbcb] p-3 mb-2.5 rounded-[4px] ${elevated ? 'shadow-sm' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
