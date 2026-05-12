import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', state: { routes: [{ name: 'HomeTab', state: { routes: [{ name: 'Home' }, { name: 'Assessment' }], index: 1 } }], index: 0 } } as any] });
    } catch (e: any) {
      Alert.alert('Login failed', e.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E6A7E', '#4A8B9F']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.logoRow}>
            <Ionicons name="aperture-outline" size={32} color="#fff" />
            <Text style={styles.appName}>MindPath</Text>
          </View>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your account</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.loginBtnText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
            <Text style={styles.signupLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })} style={styles.skipBtn}>
          <Text style={styles.skipText}>Continue without account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 32 },
  headerInner: { paddingHorizontal: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  appName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heading: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  form: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md, paddingTop: 28 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 18,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 16, marginTop: 4, marginBottom: 20,
  },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  signupText: { fontSize: 14, color: Colors.textSecondary },
  signupLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  skipBtn: { alignItems: 'center' },
  skipText: { fontSize: 13, color: Colors.textTertiary, textDecorationLine: 'underline' },
});
