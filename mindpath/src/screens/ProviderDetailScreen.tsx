import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Provider } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { getProviderById } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { RatingStars } from '../components/ui/RatingStars';
import { useSaved } from '../context/SavedContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProviderDetail'>;

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 260;

export default function ProviderDetailScreen({ navigation, route }: Props) {
  const { providerId } = route.params;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggleSaved, isSaved } = useSaved();
  const saved = provider ? isSaved(provider.id) : false;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    getProviderById(providerId)
      .then(setProvider)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Loading...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Provider not found</Text>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 80, HEADER_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-80, 0],
    outputRange: [1.15, 1],
    extrapolate: 'clamp',
  });

  const FAQ_ITEMS = [
    {
      q: `What should I expect in my first session with ${provider.name.split(' ')[0]}?`,
      a: `Your first session is typically an intake appointment where ${provider.name.split(' ')[0]} will learn about your background, current concerns, and goals for therapy. It's a two-way conversation — you're also evaluating whether this is the right fit for you.`,
    },
    {
      q: 'How long does treatment typically last?',
      a: "Treatment length varies by person and presenting concerns. Some clients find what they need in 8\u201312 sessions; others benefit from longer-term work. We'll set goals together and check in on progress regularly.",
    },
    {
      q: 'Do you offer a sliding scale fee?',
      a: `${provider.session_rate ? `Standard session rates are ${provider.session_rate}.` : ''} Please reach out to discuss your financial situation — accommodations may be available on a case-by-case basis.`,
    },
    {
      q: 'What is your cancellation policy?',
      a: "Sessions cancelled with less than 24 hours' notice may be subject to a late cancellation fee. Please contact the office as early as possible if you need to reschedule.",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Animated sticky header (shows on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']} style={styles.stickyHeaderInner}>
          <TouchableOpacity
            style={styles.stickyBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stickyTitle} numberOfLines={1}>
            {provider.name}
          </Text>
          <TouchableOpacity
            style={styles.stickyBackBtn}
            onPress={() => toggleSaved(provider)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <Animated.View style={[styles.hero, { transform: [{ scale: heroScale }] }]}>
          <LinearGradient
            colors={['#2E6A7E', '#4A8B9F', '#5A9E8B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.heroInner}>
            {/* Back and save buttons */}
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.textInverse} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => toggleSaved(provider)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={Colors.textInverse}
                />
              </TouchableOpacity>
            </View>

            {/* Avatar + identity */}
            <View style={styles.heroContent}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: provider.image }} style={styles.avatar} />
                {provider.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                  </View>
                )}
              </View>
              <Text style={styles.heroName}>{provider.name}</Text>
              <Text style={styles.heroCreds}>{provider.credentials}</Text>
              <View style={styles.heroTypePill}>
                <Text style={styles.heroTypeText}>{provider.provider_type}</Text>
              </View>
              <RatingStars
                rating={provider.rating}
                reviewCount={provider.review_count}
                size="md"
              />
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Quick stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{provider.years_experience}</Text>
            <Text style={styles.statLabel}>yrs exp.</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{provider.review_count}</Text>
            <Text style={styles.statLabel}>reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{provider.specialties.length}</Text>
            <Text style={styles.statLabel}>specialties</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{provider.insurance_accepted.length}</Text>
            <Text style={styles.statLabel}>insurances</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionBtnOutlineText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionBtnOutlineText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Status badges */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesScroll}
          style={styles.badgesSection}
        >
          {provider.verified && (
            <Badge label="Verified Provider" variant="verified" icon="shield-checkmark-outline" size="md" />
          )}
          {provider.accepting_new_patients ? (
            <Badge label="Accepting New Patients" variant="newPatients" icon="person-add-outline" size="md" />
          ) : (
            <Badge label="Waitlist Only" variant="warning" icon="time-outline" size="md" />
          )}
          {provider.telehealth_available && (
            <Badge label="Virtual Visits" variant="telehealth" icon="videocam-outline" size="md" />
          )}
          {provider.in_person_available && (
            <Badge label="In-Person" variant="inPerson" icon="location-outline" size="md" />
          )}
          {provider.session_rate && (
            <Badge label={provider.session_rate} variant="neutral" icon="cash-outline" size="md" />
          )}
          {provider.next_available && (
            <Badge label={`Next: ${provider.next_available}`} variant="secondary" icon="calendar-outline" size="md" />
          )}
        </ScrollView>

        {/* Practice info */}
        <View style={styles.section}>
          <View style={styles.practiceCard}>
            <View style={styles.practiceRow}>
              <View style={styles.practiceIcon}>
                <Ionicons name="business-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.practiceText}>
                <Text style={styles.practiceName}>{provider.practice_name}</Text>
                <Text style={styles.practiceAddress}>
                  {provider.address}, {provider.city}, {provider.state} {provider.zip_code}
                </Text>
              </View>
              <TouchableOpacity style={styles.directionsBtn} activeOpacity={0.8}>
                <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text
            style={styles.overviewText}
            numberOfLines={expandedAbout ? undefined : 4}
          >
            {provider.overview}
          </Text>
          <TouchableOpacity
            style={styles.readMoreBtn}
            onPress={() => setExpandedAbout(!expandedAbout)}
            activeOpacity={0.7}
          >
            <Text style={styles.readMoreText}>
              {expandedAbout ? 'Show less' : 'Read more'}
            </Text>
            <Ionicons
              name={expandedAbout ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.chipWrap}>
            {provider.specialties.map((s) => (
              <View key={s} style={styles.specialtyChip}>
                <Text style={styles.specialtyChipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conditions Treated */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions Treated</Text>
          <View style={styles.listGrid}>
            {provider.conditions_treated.map((c, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.listDot} />
                <Text style={styles.listItemText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Treatment Approaches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment Approaches</Text>
          <View style={styles.approachList}>
            {provider.treatment_approaches.map((a, i) => (
              <View key={i} style={styles.approachItem}>
                <View style={styles.approachIcon}>
                  <Ionicons name="checkmark" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.approachText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expertise */}
        {provider.expertise.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas of Expertise</Text>
            <View style={styles.chipWrap}>
              {provider.expertise.map((e) => (
                <View key={e} style={[styles.specialtyChip, { backgroundColor: Colors.secondaryBg }]}>
                  <Text style={[styles.specialtyChipText, { color: '#2E7B5E' }]}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Training</Text>
          <View style={styles.educationList}>
            {provider.education.map((edu, i) => (
              <View key={i} style={styles.educationItem}>
                <View style={styles.educationIcon}>
                  <Ionicons name="school-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.educationText}>
                  <Text style={styles.educationDegree}>{edu.degree}</Text>
                  <Text style={styles.educationSchool}>{edu.school}</Text>
                  {edu.year && (
                    <Text style={styles.educationYear}>{edu.year}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance Accepted</Text>
          <View style={styles.insuranceGrid}>
            {provider.insurance_accepted.map((ins) => (
              <View key={ins} style={styles.insuranceItem}>
                <Ionicons name="card-outline" size={14} color={Colors.primary} style={{ marginRight: 5 }} />
                <Text style={styles.insuranceText}>{ins}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.chipWrap}>
            {provider.languages.map((l) => (
              <View key={l} style={[styles.specialtyChip, { backgroundColor: Colors.accentBg }]}>
                <Text style={[styles.specialtyChipText, { color: '#B5622A' }]}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Patient Reviews</Text>
            <View style={styles.overallRating}>
              <Text style={styles.overallRatingNum}>{provider.rating.toFixed(1)}</Text>
              <RatingStars rating={provider.rating} showCount={false} size="sm" />
              <Text style={styles.overallRatingCount}>({provider.review_count})</Text>
            </View>
          </View>

          <View style={styles.reviewsList}>
            {provider.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {review.author[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <View style={styles.reviewRatingRow}>
                      <RatingStars rating={review.rating} showCount={false} size="sm" />
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewContent}>{review.content}</Text>
                {review.helpful_count !== undefined && (
                  <TouchableOpacity style={styles.helpfulBtn} activeOpacity={0.7}>
                    <Ionicons name="thumbs-up-outline" size={13} color={Colors.textTertiary} />
                    <Text style={styles.helpfulText}>Helpful ({review.helpful_count})</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.viewAllReviews} activeOpacity={0.8}>
            <Text style={styles.viewAllReviewsText}>
              View all {provider.review_count} reviews
            </Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.faqQuestion}>
                  <Text style={styles.faqQuestionText}>{item.q}</Text>
                  <Ionicons
                    name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.textTertiary}
                  />
                </View>
                {expandedFaq === i && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky footer CTA */}
      <View style={styles.stickyFooter}>
        <SafeAreaView edges={['bottom']} style={styles.stickyFooterInner}>
          <View style={styles.stickyFooterContent}>
            <View>
              <Text style={styles.footerName} numberOfLines={1}>
                {provider.name}
              </Text>
              {provider.next_available && (
                <Text style={styles.footerAvailability}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.secondary} /> Next: {provider.next_available}
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...Shadows.xs,
  },
  stickyHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  stickyBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTitle: {
    ...Typography.heading4,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  hero: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: Colors.surfaceAlt,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.textInverse,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.3,
  },
  heroCreds: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },
  heroTypePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  heroTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '400',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: Radius.md,
  },
  actionBtnOutline: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  actionBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
    flex: 1.4,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  badgesSection: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  badgesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  section: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.heading4,
    marginBottom: 14,
  },
  practiceCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  practiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceText: {
    flex: 1,
  },
  practiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  practiceAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  directionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialtyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primaryDark,
  },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: '47%',
    minWidth: 150,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  listItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  approachList: {
    gap: 10,
  },
  approachItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  approachIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  approachText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  educationList: {
    gap: 14,
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  educationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  educationText: {
    flex: 1,
  },
  educationDegree: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  educationSchool: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  educationYear: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  insuranceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insuranceText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overallRatingNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  overallRatingCount: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  reviewsList: {
    gap: 14,
  },
  reviewCard: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  reviewContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  helpfulText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  viewAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  viewAllReviewsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadows.lg,
  },
  stickyFooterInner: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
  },
  stickyFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  footerAvailability: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
