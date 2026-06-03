import axiosInstance from '../Utils/AxiosInstance';

export const aadhaarKycAPI = {

  sendOtp: async ({ aadhaarNumber, consentAccepted }) => {
    const response = await axiosInstance.post('borrower/ekyc/aadhaar/send-otp', {
      aadhaarNumber,
      consentAccepted,
    });
    return response.data;
  }, 

  verifyOtp: async ({ aadhaarNumber, otp, transactionId }) => {
    const response = await axiosInstance.post('borrower/ekyc/aadhaar/verify-otp', {
      aadhaarNumber,
      otp,
      transactionId,
    });
    return response.data;
  },
};

export default aadhaarKycAPI;
