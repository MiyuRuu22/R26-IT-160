import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export function SplashScreen() {
  const { isLoading } = useAuthStore();

  return (
    <View className="flex-1 bg-paper items-center justify-center">
      <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 64, letterSpacing: -0.03 * 64, lineHeight: 64 * 0.9 }} className="text-ink">
        Lex<Text className="text-accent">.</Text>
      </Text>
    </View>
  );
}
