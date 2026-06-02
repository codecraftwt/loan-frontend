import axiosInstance from '../Utils/AxiosInstance';

export const ratingAPI = {
  submitRating: async ({ rating, feedback, selectedOptions }) => {
    try {
      const response = await axiosInstance.post('ratings/submit', {
        rating,
        feedback,
        selectedOptions,
      });
      return response.data;
    } catch (error) {
      console.log('Axios error response:', JSON.stringify(error.response, null, 2));
      if (error.response) {
        // Extract error message properly
        let errorMessage = 'Failed to submit rating';
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = 'Server error occurred';
        }
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach server');
      }
      throw error;
    }
  },

  getUserRating: async () => {
    try {
      const response = await axiosInstance.get('ratings/my-rating');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, message: 'No rating found' };
      }
      throw error;
    }
  },
};

export default ratingAPI;