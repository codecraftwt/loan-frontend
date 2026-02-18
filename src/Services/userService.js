import axiosInstance from '../Utils/AxiosInstance';

export const userAPI = {
  changePassword: async ({ currentPassword, newPassword, confirmNewPassword }) => {
    try {
      const response = await axiosInstance.post('user/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default userAPI;
