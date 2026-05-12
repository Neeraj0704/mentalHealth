import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';

import { BASE_URL } from '../config';

type Props = NativeStackScreenProps<LearnStackParamList, 'Learn'>;

interface Condition {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  tagline: string;
  overview: string;
  source: string;
}

export default function LearnScreen({ navigation }: Props) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/learn/conditions`)
      .then(r => r.json())
      .then(d => { setConditions(d.conditions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E6A7E', '#4A8B9F']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Text style={styles.headerTitle}>Learn</Text>
          <Text style={styles.headerSub}>Trusted mental health information</Text>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conditions}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.sourceNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
              <Text style={styles.sourceNoteText}>Content sourced from NIMH and APA clinical guidelines</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: item.color }]}
              onPress={() => navigation.navigate('LearnDetail', { conditionId: item.id })}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTagline}>{item.tagline}</Text>
                <Text style={styles.cardOverview} numberOfLines={2}>{item.overview}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerInner: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  list: { padding: Spacing.md, gap: 12, paddingBottom: 100 },
  sourceNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.md,
    padding: 12, marginBottom: 4,
  },
  sourceNoteText: { fontSize: 12, color: Colors.primary, fontWeight: '500', flex: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadows.sm,
    borderLeftWidth: 4,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  cardTagline: { fontSize: 12, color: Colors.textTertiary, marginBottom: 4, fontStyle: 'italic' },
  cardOverview: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
