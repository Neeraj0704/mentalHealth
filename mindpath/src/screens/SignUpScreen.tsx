import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are the same.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'PreferencesSetup' }] });
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message || 'Please try again.');
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
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Find the right support for you</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color={Colors.textTertiary} />
          <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} autoCapitalize="words" />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} />
          <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor={Colors.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} />
          <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor={Colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} />
          <TextInput style={styles.input} placeholder="Repeat password" placeholderTextColor={Colors.textTertiary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.registerBtnText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })} style={styles.skipBtn}>
          <Text style={styles.skipText}>Continue without account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  form: { padding: Spacing.md, paddingTop: 28 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 18,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 16, marginTop: 4, marginBottom: 20,
  },
  registerBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  loginText: { fontSize: 14, color: Colors.textSecondary },
  loginLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  skipBtn: { alignItems: 'center' },
  skipText: { fontSize: 13, color: Colors.textTertiary, textDecorationLine: 'underline' },
});
