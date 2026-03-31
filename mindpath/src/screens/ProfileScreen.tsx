import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { Badge } from '../components/ui/Badge';
import { INSURANCE_OPTIONS, LANGUAGE_OPTIONS } from '../data/mockProviders';

const INSURANCE_DISPLAY = INSURANCE_OPTIONS.slice(0, 6);
const LANGUAGE_DISPLAY = LANGUAGE_OPTIONS.slice(0, 5);

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  onPress,
  showChevron = true,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [telehealth, setTelehealth] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>('Aetna');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>('English');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2E6A7E', '#4A8B9F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* User avatar */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>YN</Text>
              </View>
              <TouchableOpacity style={styles.avatarEditBtn} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={14} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Your Name</Text>
              <Text style={styles.userSub}>Personal account</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.prefChips}
              >
                {INSURANCE_DISPLAY.map((ins) => (
                  <TouchableOpacity
                    key={ins}
                    style={[
                      styles.prefChip,
                      selectedInsurance === ins && styles.prefChipSelected,
                    ]}
                    onPress={() =>
                      setSelectedInsurance(selectedInsurance === ins ? null : ins)
                    }
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.prefChipText,
                        selectedInsurance === ins && styles.prefChipTextSelected,
                      ]}
                    >
                      {ins}
                    </Text>
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.prefChips}
              >
                {LANGUAGE_DISPLAY.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.prefChip,
                      selectedLanguage === lang && styles.prefChipSelected,
                    ]}
                    onPress={() =>
                      setSelectedLanguage(selectedLanguage === lang ? null : lang)
                    }
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.prefChipText,
                        selectedLanguage === lang && styles.prefChipTextSelected,
                      ]}
                    >
                      {lang}
                    </Text>
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
              <Switch
                value={telehealth}
                onValueChange={setTelehealth}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>
          </View>
        </View>

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
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <SettingRow
              icon="person-outline"
              iconBg={Colors.primaryBg}
              iconColor={Colors.primary}
              label="Edit Profile"
              value="Personal info"
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="lock-closed-outline"
              iconBg={Colors.surfaceAlt}
              iconColor={Colors.textSecondary}
              label="Privacy"
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="star-outline"
              iconBg={Colors.ratingBg}
              iconColor={Colors.rating}
              label="Rate MindPath"
              value="App Store"
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.card}>
            <SettingRow
              icon="help-circle-outline"
              iconBg={Colors.secondaryBg}
              iconColor={Colors.secondary}
              label="Help Center"
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="chatbubble-ellipses-outline"
              iconBg={Colors.primaryBg}
              iconColor={Colors.primary}
              label="Send Feedback"
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon="document-text-outline"
              iconBg={Colors.surfaceAlt}
              iconColor={Colors.textSecondary}
              label="Terms & Privacy"
            />
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
              <Text style={styles.crisisSub}>
                Call or text 988 for the Suicide & Crisis Lifeline
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.crisisBtn} activeOpacity={0.85}>
            <Text style={styles.crisisBtnText}>Call 988 Now</Text>
            <Ionicons name="call-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>MindPath v1.0.0 · For demo purposes only</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: Spacing.xl,
  },
  headerInner: {
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 3,
  },
  userSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  sectionBlock: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  prefItem: {
    padding: 14,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  prefIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  prefSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  prefChips: {
    gap: 7,
    paddingLeft: 46,
  },
  prefChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  prefChipSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  prefChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  prefChipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  prefDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 60,
  },
  crisisCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  crisisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  crisisText: {
    flex: 1,
  },
  crisisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 3,
  },
  crisisSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 17,
  },
  crisisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: 12,
  },
  crisisBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
