import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../constants';
import Header from '../../Components/Header';

const AgreementScreen = ({ route }) => {
  const { agreement } = route.params || {};

  return (
    <View style={styles.container}>
      <Header title="Loan Agreement" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.titleIconContainer}>
              <Icon name="file-document-outline" size={24} color="#ff7900" />
            </View>
            <Text style={styles.screenTitle}>Loan Agreement</Text>
          </View>

          <Text style={styles.agreementText}>
            {agreement || 'No agreement available for this loan.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(20),
    paddingBottom: m(40),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  titleIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  screenTitle: {
    flex: 1,
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    textAlign: 'left',
  },
  agreementText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#374151',
    lineHeight: m(22),
    textAlign: 'left',
    paddingTop: m(4),
  },
});

export default AgreementScreen;
