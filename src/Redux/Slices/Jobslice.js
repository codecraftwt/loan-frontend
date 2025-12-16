// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import instance from '../../Utils/AxiosInstance';
// import Toast from 'react-native-toast-message';

// export const fetchJobData = createAsyncThunk(
//   'jobs/fetchJobData',
//   async () => {
//     try {
//       const response = await instance.get(`/api/job`);
//       return response.data.data;
//     } catch (error) {
//       throw error
//     }
//   }
// );

// export const postJobData = createAsyncThunk(
//   'jobs/postJobData',
//   async (jobData) => {
//     try {
//       const response = await instance.post(`/api/job`, jobData);
//       return response.data.data[0];
//     } catch (error) {
//       Toast.show({
//         text1: "Failed to Save Job",
//         type:'error',
//         position: 'bottom'
//       });
//       throw error;
//     }
//   }
// );

// export const filterJobs = createAsyncThunk(
//   'jobs/filterJobs',
//   async (data) => {
//     try {
//       const response = await instance.post(`api/job/filter`, data);
//       return response.data.data;
//     } catch (error) {
//       throw error;
//     }
//   }
// );

// export const updateJobData = createAsyncThunk(
//   'update/updateJobData', async ({ id, jobData }) => {
//     try {
//       const response = await instance.patch(`/api/job/${id}`, jobData)
//       return (response.data.data[0]);
//     } catch (error) {
//       Toast.show({
//         text1: "Failed to update Job",
//         type:'error',
//         position: 'bottom'
//       });
//       throw error
//     }
//   }
// )

// export const deleteJobData = createAsyncThunk(
//   'jobs/deleteJobData',
//   async (id) => {
//     try {
//       const response = await instance.delete(`/api/job/${id}`);
//       Toast.show({
//         text1: `${response.data.message}`,
//         position: 'bottom'
//       })
//       return { id, message: response.data.message };
//     } catch (error) {
//       Toast.show({
//         text1: "Failed to delete job",
//         type:'error',
//         position: 'bottom'
//       });
//       throw error;
//     }
//   }
// );

// export const applyJob = createAsyncThunk(
//   'update/applyJob', async ({ JobId, userId }) => {
//     try {
//       const response = await instance.post(`/api/application/${JobId}`, { "userId": userId })
//       return (response.data);
//     } catch (error) {
//       throw error
//     }
//   }
// )

// export const appliedJobs = createAsyncThunk(
//   'update/appliedJobs', async (id) => {
//     try {
//       const response = await instance.get(`/api/applied-jobs/${id}`)
//       return response.data.data.appliedJobs;
//     } catch (error) {
//       throw error
//     }
//   }
// )

// export const ownJobs = createAsyncThunk(
//   'jobs/ownJobs',
//   async (data) => {
//     try {
//       const response = await instance.post(`api/job/filter`, data);
//       return response.data.data;
//     } catch (error) {
//       throw error;
//     }
//   }
// );

// export const fetchJobDetails = createAsyncThunk(
//   'jobs/fetchJobDetails',
//   async (id) => {
//     try {
//       const response = await instance.get(`api/job/${id}`);
//       return response.data.data;
//     } catch (error) {
//       throw error
//     }
//   }
// );

// export const saveJob = createAsyncThunk(
//   'jobs/saveJob',
//   async ({ jobId, userId }) => {
//     try {
//       const response = await instance.post(`/api/save-job/${jobId}`, { userId });
//       Toast.show({
//         text1: response.data.message,
//         position: 'bottom'
//       });
//       return { jobId };
//     } catch (error) {
//       throw error;
//     }
//   }
// );

// export const unsaveJob = createAsyncThunk(
//   'jobs/unsaveJob',
//   async ({ jobId, userId }) => {
//     try {
//       const response = await instance.post(`/api/unsave-job/${jobId}`, { userId });
//       Toast.show({
//         text1: response.data.message,
//         position: 'bottom'
//       });
//       return { jobId };
//     } catch (error) {
//       throw error;
//     }
//   }
// );

// export const savedJobsData = createAsyncThunk(
//   'jobs/savedJobsData',
//   async (id) => {
//     try {
//       const response = await instance.get(`/api/saved-jobs/${id}`);
//       const filteredresponse = response.data?.data?.saved_jobs?.map(job => parseInt(job.job_id))
//       return filteredresponse;
//     } catch (error) {
//       throw error;
//     }
//   }
// );



// const jobSlice = createSlice({
//   name: 'jobs',
//   initialState: {
//     jobData: [],
//     SavedJobs: [],
//     FilteredJobs: [],
//     AppliedJobs: [],
//     ownJobs: [],
//     JobDetails: null,
//     loading: false,
//     modifyloading:false,
//     error: null,
//   },
//   // reducers: {
//   //   Saved: (state, action) => {
//   //     state.SavedJobs.push(action.payload);
//   //   },
//   //   unSaved: (state, action) => {
//   //     state.SavedJobs = state.SavedJobs.filter(job => job.id !== action.payload.id);
//   //   },
//   // },

//   extraReducers: (builder) => {
//     builder
//       .addCase(saveJob.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(saveJob.fulfilled, (state, action) => {
//         state.loading = false;
//         state.SavedJobs.push(action.payload.jobId);
//         state.error = null;
//       })
//       .addCase(saveJob.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(appliedJobs.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(appliedJobs.fulfilled, (state, action) => {
//         state.loading = false;
//         state.AppliedJobs = action.payload;
//         state.error = null;
//       })
//       .addCase(appliedJobs.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(savedJobsData.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(savedJobsData.fulfilled, (state, action) => {
//         state.loading = false;
//         state.SavedJobs = action.payload;
//         state.error = null;
//       })
//       .addCase(savedJobsData.rejected, (state, action) => {
//         state.loading = false;
//       })

//       .addCase(unsaveJob.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(unsaveJob.fulfilled, (state, action) => {
//         state.loading = false;
//         state.SavedJobs = state.SavedJobs.filter(jobId => jobId !== action.payload.jobId);
//         state.error = null;
//       })
//       .addCase(unsaveJob.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(fetchJobData.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchJobData.fulfilled, (state, action) => {
//         state.loading = false;
//         state.jobData = action.payload;
//         state.error = null
//       })
//       .addCase(fetchJobData.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(filterJobs.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(filterJobs.fulfilled, (state, action) => {
//         state.loading = false;
//         state.FilteredJobs = action.payload;
//         state.error = null
//       })
//       .addCase(filterJobs.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(ownJobs.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(ownJobs.fulfilled, (state, action) => {
//         state.loading = false;
//         state.ownJobs = action.payload;
//         state.error = null
//       })
//       .addCase(ownJobs.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(fetchJobDetails.pending, (state) => {
//         state.modifyloading = true;
//       })
//       .addCase(fetchJobDetails.fulfilled, (state, action) => {
//         state.modifyloading = false;
//         state.JobDetails = action.payload;
//         state.error = null
//       })
//       .addCase(fetchJobDetails.rejected, (state, action) => {
//         state.modifyloading = false;
//         state.error = action.error.message;
//       })
//       .addCase(postJobData.pending, (state) => {
//         state.modifyloading = true;
//       })
//       .addCase(postJobData.fulfilled, (state, action) => {
//         state.modifyloading = false;
//         state.jobData.unshift(action.payload);
//         state.ownJobs.unshift(action.payload);
//         state.error = null;
//       })
//       .addCase(postJobData.rejected, (state, action) => {
//         state.modifyloading = false;
//         state.error = action.error.message;
//       })
//       .addCase(updateJobData.pending, (state) => {
//         state.modifyloading = true;
//       })
//       .addCase(updateJobData.fulfilled, (state, action) => {
//         state.modifyloading = false;
//         const index = state.jobData.findIndex((jobData) => jobData.id === action.payload.id);
//         if (index !== -1) {
//           state.jobData[index] = action.payload;
//         }
//         const filterindex = state.ownJobs.findIndex((jobData) => jobData.id === action.payload.id);
//         if (filterindex !== -1) {
//           state.ownJobs[filterindex] = action.payload;
//         }
//         state.error = null;
//       })
//       .addCase(updateJobData.rejected, (state, action) => {
//         state.modifyloading = false;
//         state.error = action.error.message;
//       })
//       .addCase(deleteJobData.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(deleteJobData.fulfilled, (state, action) => {
//         state.loading = false;
//         const { id } = action.payload;
//         state.jobData = state.jobData.filter((jobData) => jobData.id !== id);
//         state.ownJobs = state.ownJobs.filter((jobData) => jobData.id !== id);
//         state.error = null;
//       })
//       .addCase(deleteJobData.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       });
//   },
// });

// export const { Saved, unSaved } = jobSlice.actions;
// export default jobSlice.reducer;
