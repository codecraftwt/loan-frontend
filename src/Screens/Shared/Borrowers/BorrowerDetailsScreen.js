import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import { colors, FontFamily } from '../../../constants';

const HEADER_TOP_PADDING =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight || m(24)) + m(16)
    : m(50);

const DETAILS_THEME = {
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E2DED4',
  primary: '#1f7f69',
  primaryDark: '#0d4f43',
  iconBg: colors.mintSoft,
};

const DetailItem = ({ icon, label, value, iconBg, iconColor }) => {
  return (
    <View style={styles.detailItem}>
      <View style={[styles.detailIconContainer, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text
          style={styles.detailValue}
          numberOfLines={label === 'Address' ? 3 : 2}
        >
          {value || 'N/A'}
        </Text>
      </View>
    </View>
  );
};

export default function BorrowerDetailsScreen({ route, navigation }) {
  const { borrowerDetails } = route.params || {};

  if (!borrowerDetails) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyDark} />
        <LinearGradient
          colors={[colors.navyDark, colors.navy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topHeader}
        >
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="chevron-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.screenTitle}>Borrower Details</Text>
            <Text style={styles.screenSubtitle}>
              Full profile & loan documents
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Borrower details not available</Text>
        </View>
      </View>
    );
  }

  const borrowerInfo = [
    {
      label: 'Full Name',
      value: borrowerDetails.userName,
      icon: 'person',
      iconBg: colors.skySoft,
      iconColor: colors.skyText,
    },
    {
      label: 'Email',
      value: borrowerDetails.email,
      icon: 'email',
      iconBg: colors.mintSoft,
      iconColor: colors.mintText,
    },
    {
      label: 'Mobile Number',
      value: borrowerDetails.mobileNo,
      icon: 'phone',
      iconBg: colors.butter,
      iconColor: colors.goldDarker,
    },
    {
      label: 'Aadhar Card Number',
      value: borrowerDetails.aadharCardNo,
      icon: 'badge',
      iconBg: colors.goldFaint,
      iconColor: colors.goldDarker,
    },
    {
      label: 'PAN Card Number',
      value: borrowerDetails.panCardNumber || 'Not provided',
      icon: 'credit-card',
      iconBg: colors.skySoft,
      iconColor: colors.skyText,
    },
    {
      label: 'Address',
      value: borrowerDetails.address,
      icon: 'location-on',
      iconBg: colors.mintSoft,
      iconColor: colors.mintText,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyDark} />
      <LinearGradient
        colors={[colors.navyDark, colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topHeader}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="chevron-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.screenTitle}>Borrower Details</Text>
          <Text style={styles.screenSubtitle}>
            Full profile & loan documents
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {borrowerDetails.profileImage ? (
              <Image
                source={{ uri: borrowerDetails.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {borrowerDetails.userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={2}>
                {borrowerDetails.userName}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Icon name="email" size={14} color="#6B7280" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {borrowerDetails.email || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {borrowerDetails.mobileNo || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.detailsTitle}>Personal Information</Text>
            <View style={styles.sectionBadge}>
              <Icon
                name="verified-user"
                size={14}
                color={DETAILS_THEME.primary}
              />
              <Text style={styles.sectionBadgeText}>Verified</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            {borrowerInfo.map((item, index) => (
              <DetailItem
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Icon name="access-time" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            Registered {moment(borrowerDetails.createdAt).fromNow()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: m(124),
    paddingTop: HEADER_TOP_PADDING,
    paddingHorizontal: m(22),
    paddingBottom: m(18),
    borderBottomLeftRadius: m(26),
    borderBottomRightRadius: m(26),
  },
  headerBackButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
  },
  headerTextBlock: {
    flex: 1,
  },
  screenTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  screenSubtitle: {
    marginTop: m(3),
    fontSize: m(12),
    fontFamily: FontFamily.bodyMedium,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingTop: m(18),
    paddingBottom: m(24),
  },
  profileCard: {
    backgroundColor: DETAILS_THEME.card,
    paddingVertical: m(22),
    paddingHorizontal: m(20),
    borderRadius: m(18),
    borderWidth: 1,
    borderColor: DETAILS_THEME.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    marginRight: m(16),
  },
  profileAvatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: DETAILS_THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  avatarText: {
    fontSize: m(23),
    fontFamily: FontFamily.primaryBold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: DETAILS_THEME.text,
    marginBottom: m(7),
  },
  profileMeta: {
    gap: m(5),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: DETAILS_THEME.muted,
    marginLeft: m(6),
    flex: 1,
  },
  detailsCard: {
    backgroundColor: DETAILS_THEME.card,
    marginTop: m(18),
    paddingVertical: m(20),
    paddingHorizontal: m(18),
    borderRadius: m(18),
    borderWidth: 1,
    borderColor: DETAILS_THEME.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(16),
    gap: m(8),
  },
  detailsTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: DETAILS_THEME.text,
    flex: 1,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    paddingHorizontal: m(12),
    paddingVertical: m(7),
    borderRadius: m(20),
  },
  sectionBadgeText: {
    fontSize: m(12),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.mintText,
    marginLeft: m(4),
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: m(8),
    rowGap: m(8),
  },
  detailItem: {
    width: '48%',
    minHeight: m(88),
    padding: m(10),
    borderRadius: m(10),
    backgroundColor: '#F7F5EF',
    borderWidth: 1,
    borderColor: '#DEDACF',
  },
  detailIconContainer: {
    width: m(26),
    height: m(26),
    borderRadius: m(7),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  detailContent: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.bodyRegular,
    color: DETAILS_THEME.muted,
    marginBottom: m(3),
  },
  detailValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: DETAILS_THEME.text,
    lineHeight: m(16),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: m(20),
    paddingBottom: m(6),
  },
  footerText: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: '#8A9A93',
    marginLeft: m(6),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: m(16),
    fontFamily: FontFamily.primarySemiBold,
    color: '#EF4444',
  },
});
