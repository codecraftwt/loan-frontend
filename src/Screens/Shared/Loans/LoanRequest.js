import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {m} from 'walstar-rn-responsive';

const LoanRequest = () => {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  const [emi, setEmi] = useState(null);

  const calculateEMI = (loanAmount, interestRate, durationMonths) => {
    const principal = loanAmount;
    const rateOfInterest = interestRate / 12 / 100;
    const numberOfInstallments = durationMonths;

    const emi =
      (principal *
        rateOfInterest *
        Math.pow(1 + rateOfInterest, numberOfInstallments)) /
      (Math.pow(1 + rateOfInterest, numberOfInstallments) - 1);
    return emi;
  };

  const handleLoanRequest = () => {
    // Calculate EMI based on user input
    const calculatedEMI = calculateEMI(
      Number(loanAmount),
      Number(interestRate),
      Number(duration),
    );
    setEmi(calculatedEMI);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>Apply for a Loan</Text>
      </View>

      <View style={styles.loanForm}>
        <Text style={styles.TitleText}>Calculate Loan EMI</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter loan amount"
          keyboardType="numeric"
          value={loanAmount}
          onChangeText={setLoanAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter annual interest rate (%)"
          keyboardType="numeric"
          value={interestRate}
          onChangeText={setInterestRate}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter loan duration (in months)"
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
        <TouchableOpacity style={styles.button} onPress={handleLoanRequest}>
          <Text style={styles.buttonText}>Calculate EMI</Text>
        </TouchableOpacity>
      </View>

      {emi && (
        <View style={styles.result}>
          <Text style={styles.resultText}>
            Your Monthly EMI: ₹{emi.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerBar: {
    backgroundColor: '#b80266',
    height: m(60),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: m(15),
    borderBottomEndRadius: m(15),
    borderBottomStartRadius: m(15),
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: m(20),
    fontFamily: 'Montserrat-Bold',
  },
  TitleText: {
    fontSize: m(20),
    fontFamily: 'Montserrat-Bold',
    marginBlock: m(10),
  },
  loanForm: {
    padding: m(25),
  },
  input: {
    height: m(50),
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: m(15),
    paddingHorizontal: m(10),
    fontSize: m(16),
  },
  button: {
    backgroundColor: '#b80266',
    borderRadius: m(8),
    paddingVertical: m(12),
    marginHorizontal: m(40),
    marginBlock: m(20),
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: m(18),
    fontFamily: 'Poppins-SemiBold',
  },
  result: {
    marginTop: m(20),
    padding: m(10),
    backgroundColor: '#b80266',
    borderRadius: m(8),
    alignItems: 'center',
  },
  resultText: {
    fontSize: m(18),
    color: '#fff',
  },
});

export default LoanRequest;
