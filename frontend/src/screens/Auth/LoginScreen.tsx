import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-5"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 40, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          <View className="mb-6">
            <Text style={{ fontFamily: 'Fraunces_400Regular_Italic', fontSize: 32, letterSpacing: -0.03 * 32, lineHeight: 32 * 0.9 }} className="text-ink">
              Lex<Text className="text-accent">.</Text>
            </Text>
          </View>
          
          <View className="mb-6">
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 26, letterSpacing: -0.02 * 26, lineHeight: 26 }} className="text-ink mb-2">
              Welcome,{'\n'}Counsel.
            </Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 13, lineHeight: 13 * 1.5 }} className="text-muted">
              Sign in with your verified Bar credentials to continue.
            </Text>
          </View>

          <View className="flex-col gap-1 mt-2">
            <Input 
              label="Bar Registration No. / Email" 
              placeholder="LK / SC / 8842" 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input 
              label="Password" 
              placeholder="••••••••••••" 
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); clearError(); }}
            />
            
            <View className="flex-row justify-between items-center mt-1">
              <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11 }} className="text-muted">Use Face ID</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11 }} className="text-accent">Request Access?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text className="text-danger text-xs mt-2 font-bold">{error}</Text> : null}
            
            <View className="mt-4">
              <Button 
                label={loading ? "Authenticating..." : "Sign In Securely  →"} 
                onPress={handleLogin} 
                disabled={loading}
              />
            </View>
            <View className="mt-2">
              <Button 
                variant="secondary"
                label="Use Biometric ID" 
              />
            </View>
          </View>

          <View className="mt-6 p-3 border-l-2 border-accent bg-white">
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, lineHeight: 11 * 1.5 }} className="text-muted">
              All sessions are end-to-end encrypted. Your client data never leaves the secure enclave.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
