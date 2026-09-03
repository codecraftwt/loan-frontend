const STATIC_AADHAAR_OTP = '123456';

export const aadhaarKycAPI = {

  sendOtp: async ({ aadhaarNumber, consentAccepted }) => {
    return {
      success: true,
      message: 'OTP sent successfully.',
      mockOtp: STATIC_AADHAAR_OTP,
      transactionId: `static-${aadhaarNumber}`,
      consentAccepted,
    };
  }, 

  verifyOtp: async ({ aadhaarNumber, otp, transactionId }) => {
    if (otp !== STATIC_AADHAAR_OTP) {
      throw new Error('Invalid OTP. Use 123456 for testing.');
    }

    return {
      success: true,
      verified: true,
      status: 'success',
      transactionId,
      kycData: {
        aadhaarNumber,
        name: 'Rohan Sharma',
      },
    };
  },
};

export default aadhaarKycAPI;
