import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    await register(email, name, password);
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
              Request{'\n'}Access.
            </Text>
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 13, lineHeight: 13 * 1.5 }} className="text-muted">
              Register your credentials. Manual bar verification may take up to 24 hours.
            </Text>
          </View>

          <View className="flex-col gap-1 mt-2">
            <Input 
              label="Full Legal Name" 
              placeholder="A. Sundara Wickramasinghe" 
              value={name}
              onChangeText={setName}
            />
            <Input 
              label="Bar Registration No. / Email" 
              placeholder="lawyer@firm.com" 
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
            
            <View className="flex-row justify-end items-center mt-1">
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 11 }} className="text-accent">Already registered? Sign in</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text className="text-danger text-xs mt-2 font-bold">{error}</Text> : null}
            
            <View className="mt-4">
              <Button 
                label={loading ? "Submitting..." : "Submit Registration  →"} 
                onPress={handleRegister} 
                disabled={loading}
              />
            </View>
          </View>

          <View className="mt-6 p-3 border-l-2 border-accent bg-white">
            <Text style={{ fontFamily: 'InterTight_400Regular', fontSize: 11, lineHeight: 11 * 1.5 }} className="text-muted">
              Ethical AI · HITL Certified. Your data remains strictly within the localized, encrypted vault.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
