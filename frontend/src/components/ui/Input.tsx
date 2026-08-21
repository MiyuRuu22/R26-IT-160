import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export function Input({ label, icon, className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-2.5">
      {label && <Text style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }} className="text-muted mb-1">{label}</Text>}
      <View className={`flex-row items-center bg-white border rounded-[3px] px-3 py-2 ${isFocused ? 'border-ink bg-[#fffcef]' : 'border-[#d6d0bf]'} ${className || ''}`}>
        {icon && <View className="mr-2">{icon}</View>}
        <TextInput
          className="flex-1 text-ink"
          style={{ fontFamily: 'InterTight_400Regular', fontSize: 12 }}
          placeholderTextColor="#94a3b8"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus && props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur && props.onBlur(e);
          }}
          {...props}
        />
      </View>
    </View>
  );
}
