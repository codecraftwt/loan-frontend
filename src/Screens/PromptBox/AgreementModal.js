import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {m} from 'walstar-rn-responsive';

const AgreementModal = ({isVisible, agreement, onClose}) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Loan Agreement</Text>

          <ScrollView style={styles.agreementContainer}>
            <Text style={styles.agreementText}>
              {agreement || 'No agreement available for this loan.'}
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: m(20),
    borderRadius: m(16),
    // width: m(320),
    minWidth: '80%',
    maxHeight: '80%', // Adjust modal height as needed
    maxWidth: '90%',
    marginTop: m(50), // Adjust for top margin, you can fine-tune the distance from the top
  },
  modalTitle: {
    fontSize: m(18),
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    marginBottom: m(15),
    textAlign: 'center',
  },
  agreementContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: m(14),
    fontFamily: 'Poppins-Regular',
    color: '#555',
    lineHeight: m(22),
    textAlign: 'left',
  },
  closeModalButton: {
    marginTop: m(20),
    backgroundColor: '#b80266',
    paddingVertical: m(12),
    borderRadius: m(8),
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FFF',
    fontSize: m(16),
    fontFamily: 'Poppins-SemiBold',
  },
});

export default AgreementModal;
