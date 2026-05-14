import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function CrisisModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={22} color="#fff" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>You don't have to face this alone</Text>
          <Text style={styles.subtitle}>
            Free, confidential support is available right now — 24 hours a day, 7 days a week.
          </Text>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL('tel:988')}
            activeOpacity={0.88}
          >
            <View style={styles.callBtnIcon}>
              <Ionicons name="call" size={20} color="#B91C1C" />
            </View>
            <View style={styles.callBtnText}>
              <Text style={styles.callBtnLabel}>Call or Text 988</Text>
              <Text style={styles.callBtnSub}>Suicide & Crisis Lifeline · Free · 24/7</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B91C1C" />
          </TouchableOpacity>

          {/* Secondary resources */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => Linking.openURL('sms:741741&body=HOME')}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Text HOME to 741741 — Crisis Text Line</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => Linking.openURL('tel:911')}
            activeOpacity={0.85}
          >
            <Ionicons name="alert-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Call 911 for immediate danger</Text>
          </TouchableOpacity>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            Reaching out is a sign of strength. These resources are here for you.
          </Text>

          <TouchableOpacity onPress={onClose} style={styles.dismissBtn} activeOpacity={0.8}>
            <Text style={styles.dismissBtnText}>Continue with MindPath</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: Spacing.lg,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF0F0',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FCCACA',
    marginTop: 4,
  },
  callBtnIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: { flex: 1 },
  callBtnLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
  },
  callBtnSub: {
    fontSize: 11,
    color: '#E57373',
    marginTop: 2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
