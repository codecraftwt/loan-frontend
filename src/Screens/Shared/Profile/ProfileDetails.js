import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';

const ProfileDetails = ({ navigation }) => {
  const profileData = useSelector(state => state.auth.user);

  useFetchUserFromStorage();

  // Navigation Handlers
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // Render Functions
  const renderField = (icon, label, value, iconColor = '#3B82F6') => (
    <View style={styles.fieldCard}>
      <View style={[styles.fieldIconContainer, { backgroundColor: iconColor + '15' }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Profile Details"
        showBackButton
        isEdit={true}
        onEditPress={handleEditProfile}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileImageSection}>
            <View style={styles.imageContainer}>
              {profileData?.profileImage ? (
                <Image
                  source={{ uri: profileData.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileIcon}>
                  <Icon name="user" size={56} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.userNameSection}>
              <Text style={styles.userName}>{profileData?.userName || 'User Name'}</Text>
            </View>
          </View>
        </View>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Icon name="info" size={20} color="#3B82F6" />
            <Text style={styles.infoCardTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.fieldsContainer}>
            {renderField('user', 'Name', profileData?.userName, '#3B82F6')}
            {renderField('phone', 'Phone Number', profileData?.mobileNo, '#10B981')}
            {renderField('mail', 'Email Address', profileData?.email, '#F59E0B')}
            {renderField('credit-card', 'Aadhar Number', profileData?.aadharCardNo || 'Not provided', '#3B82F6')}
            {profileData?.panCardNumber && renderField('file', 'PAN Card Number', profileData?.panCardNumber, '#10B981')}
            {renderField('map-pin', 'Address', profileData?.address, '#EF4444')}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(100),
  },
  // Profile Header Card
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileImageSection: {
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: m(20),
    borderWidth: 4,
    borderColor: '#DBEAFE',
  },
  defaultProfileIcon: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
  },
  userNameSection: {
    width: '100%',
    alignItems: 'center',
  },
  userName: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(20),
    marginBottom: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    gap: m(10),
  },
  infoCardTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  fieldsContainer: {
    gap: m(16),
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: m(16),
  },
  fieldIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: m(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    lineHeight: m(22),
  },
});
export default ProfileDetails;