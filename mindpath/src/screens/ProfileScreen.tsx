import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getPreferences, savePreferences } from '../services/preferences';

const INSURANCE_OPTIONS = ['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid', 'Self-pay'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'Chinese', 'Mandarin', 'Polish', 'Hindi', 'Russian', 'Arabic'];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, isLoggedIn } = useAuth();
  const [selectedInsurance, setSelectedInsurance] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [telehealth, setTelehealth] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');

  // Load saved preferences on mount
  useEffect(() => {
    getPreferences().then(p => {
      setSelectedInsurance(p.insurance ?? '');
      setSelectedLanguage(p.language ?? '');
      setTelehealth(p.sessionType === 'telehealth');
    });
    setEditName(user?.name ?? '');
  }, [user]);

  const handleInsuranceSelect = async (ins: string) => {
    const next = selectedInsurance === ins ? '' : ins;
    setSelectedInsurance(next);
    await savePreferences({ insurance: next });
  };

  const handleLanguageSelect = async (lang: string) => {
    const next = selectedLanguage === lang ? '' : lang;
    setSelectedLanguage(next);
    await savePreferences({ language: next });
  };

  const handleTelehealthToggle = async (val: boolean) => {
    setTelehealth(val);
    await savePreferences({ sessionType: val ? 'telehealth' : 'any' });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Consent' }] }); } },
    ]);
  };

  const handle988 = () => {
    Alert.alert('Call 988', 'This will call the Suicide & Crisis Lifeline.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL('tel:988') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E6A7E', '#4A8B9F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {user ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user ? user.name : 'Guest'}</Text>
              <Text style={styles.userSub}>{user ? user.email : 'Not signed in'}</Text>
            </View>
            {isLoggedIn ? (
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.logoutBtn} activeOpacity={0.8}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Search Preferences */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>SEARCH PREFERENCES</Text>
          <View style={styles.card}>

            {/* Insurance */}
            <View style={styles.prefItem}>
              <View style={styles.prefHeader}>
                <View style={[styles.prefIcon, { backgroundColor: Colors.primaryBg }]}>
                  <Ionicons name="card-outline" size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.prefTitle}>Insurance Plan</Text>
                  <Text style={styles.prefSub}>Used to filter providers</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefChips}>
                {INSURANCE_OPTIONS.map(ins => (
                  <TouchableOpacity
                    key={ins}
                    style={[styles.prefChip, selectedInsurance === ins && styles.prefChipSelected]}
                    onPress={() => handleInsuranceSelect(ins)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prefChipText, selectedInsurance === ins && styles.prefChipTextSelected]}>{ins}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.prefDivider} />

            {/* Language */}
            <View style={styles.prefItem}>
              <View style={styles.prefHeader}>
                <View style={[styles.prefIcon, { backgroundColor: Colors.secondaryBg }]}>
                  <Ionicons name="language-outline" size={16} color={Colors.secondary} />
                </View>
                <View>
                  <Text style={styles.prefTitle}>Language Preference</Text>
                  <Text style={styles.prefSub}>Provider's spoken language</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefChips}>
                {LANGUAGE_OPTIONS.map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.prefChip, selectedLanguage === lang && styles.prefChipSelected]}
                    onPress={() => handleLanguageSelect(lang)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prefChipText, selectedLanguage === lang && styles.prefChipTextSelected]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.prefDivider} />

            {/* Telehealth */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.prefIcon, { backgroundColor: Colors.accentBg }]}>
                  <Ionicons name="videocam-outline" size={16} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.prefTitle}>Prefer Telehealth</Text>
                  <Text style={styles.prefSub}>Show virtual visit providers first</Text>
                </View>
              </View>
              <Switch value={telehealth} onValueChange={handleTelehealthToggle} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.surface} />
            </View>
          </View>
        </View>

        {/* Account */}
        {isLoggedIn && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.settingRow} onPress={() => setShowEditModal(true)} activeOpacity={0.7}>
                <View style={[styles.prefIcon, { backgroundColor: Colors.primaryBg }]}>
                  <Ionicons name="person-outline" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Edit Profile</Text>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{user?.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Settings */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>APP SETTINGS</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.prefIcon, { backgroundColor: Colors.primaryBg }]}>
                  <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.prefTitle}>Notifications</Text>
                  <Text style={styles.prefSub}>Provider availability updates</Text>
                </View>
              </View>
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.surface} />
            </View>
          </View>
        </View>

        {/* Crisis Resources */}
        <View style={[styles.sectionBlock, styles.crisisCard]}>
          <View style={styles.crisisRow}>
            <View style={[styles.prefIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="heart-outline" size={18} color={Colors.textInverse} />
            </View>
            <View style={styles.crisisText}>
              <Text style={styles.crisisTitle}>In a mental health crisis?</Text>
              <Text style={styles.crisisSub}>Call or text 988 for the Suicide & Crisis Lifeline</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.crisisBtn} onPress={handle988} activeOpacity={0.85}>
            <Text style={styles.crisisBtnText}>Call 988 Now</Text>
            <Ionicons name="call-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>MindPath v1.0.0 · For demo purposes only</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => {
              Alert.alert('Saved', 'Profile updated.');
              setShowEditModal(false);
            }}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Full Name</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalInputText}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <Text style={styles.modalLabel}>Email</Text>
            <View style={[styles.modalInput, { opacity: 0.6 }]}>
              <TextInput
                style={styles.modalInputText}
                value={user?.email}
                editable={false}
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <Text style={styles.modalNote}>Email cannot be changed. Contact support if needed.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingBottom: Spacing.xl },
  headerInner: { paddingHorizontal: Spacing.md },
  headerTop: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: Colors.textInverse, letterSpacing: 1 },
  logoutBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.textInverse, marginBottom: 3 },
  userSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: 100 },
  sectionBlock: { marginBottom: Spacing.lg, paddingHorizontal: Spacing.md },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8, marginBottom: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadows.sm },
  prefItem: { padding: 14 },
  prefHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  prefIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prefTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prefSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },
  prefChips: { gap: 7, paddingLeft: 46 },
  prefChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border },
  prefChipSelected: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  prefChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  prefChipTextSelected: { color: Colors.primary, fontWeight: '600' },
  prefDivider: { height: 1, backgroundColor: Colors.divider },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13, color: Colors.textTertiary },
  crisisCard: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.md, ...Shadows.sm },
  crisisRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  crisisText: { flex: 1 },
  crisisTitle: { fontSize: 14, fontWeight: '700', color: Colors.textInverse, marginBottom: 3 },
  crisisSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  crisisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingVertical: 12 },
  crisisBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  versionText: { textAlign: 'center', fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.sm, marginBottom: Spacing.md },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: Colors.surface },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalCancel: { fontSize: 15, color: Colors.textSecondary },
  modalSave: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  modalContent: { padding: Spacing.md, gap: 8 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  modalInput: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: Colors.border },
  modalInputText: { fontSize: 15, color: Colors.textPrimary },
  modalNote: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
});
