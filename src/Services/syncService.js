import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import { createLoan } from '../Redux/Slices/loanSlice';
import Toast from 'react-native-toast-message';

class SyncService {
  isSyncing = false;

  async checkNetworkStatus() {
    try {
      const netInfoState = await NetInfo.fetch();
      return !!netInfoState.isConnected;
    } catch (error) {
      console.error('Error fetching NetInfo status:', error);
      return false;
    }
  }

  async syncPendingLoans(dispatch) {
    if (this.isSyncing) return;

    try {
      const isOnline = await this.checkNetworkStatus();
      if (!isOnline) {
        console.log('Skipping sync: Device is offline.');
        return;
      }

      // Query for unsynced loans
      const pendingLoans = await database.get('loans').query(
        Q.where('sync_status', 'pending')
      ).fetch();

      if (pendingLoans.length === 0) {
        return;
      }

      this.isSyncing = true;
      console.log(`Starting sync for ${pendingLoans.length} pending loans...`);

      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'Syncing Data',
        text2: `Syncing ${pendingLoans.length} offline loan(s) to server...`,
        visibilityTime: 3000,
      });

      let successCount = 0;
      let failCount = 0;

      for (const loan of pendingLoans) {
        try {
          // Prepare loan data
          const loanData = {
            name: loan.name,
            aadharCardNo: loan.aadhaarNumber,
            mobileNumber: loan.mobileNumber,
            address: loan.address,
            amount: loan.amount,
            purpose: loan.purpose,
            loanGivenDate: loan.loanStartDate,
            loanEndDate: loan.loanEndDate,
            loanMode: loan.loanMode,
          };

          // Deserialize proof if it exists
          if (loan.proof) {
            try {
              loanData.proof = JSON.parse(loan.proof);
            } catch (err) {
              console.error('Failed to parse offline proof:', err);
            }
          }

          // Dispatch the Redux action to create the loan on the server
          const response = await dispatch(createLoan(loanData));

          if (createLoan.fulfilled.match(response)) {
            // Update local DB status to synced
            await database.write(async () => {
              await loan.update(record => {
                record.syncStatus = 'synced';
              });
            });
            successCount++;
          } else {
            console.error('Failed to sync loan:', loan.id, response.payload || response.error);
            failCount++;
          }
        } catch (error) {
          console.error(`Error syncing loan ${loan.id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Sync Completed',
          text2: `Successfully synced ${successCount} loan(s).${failCount > 0 ? ` ${failCount} failed.` : ''}`,
          visibilityTime: 4000,
        });
      }
    } catch (error) {
      console.error('Error in syncPendingLoans:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  startNetworkMonitoring(dispatch) {
    // Perform initial sync check
    this.syncPendingLoans(dispatch);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Network connected, triggering sync...');
        this.syncPendingLoans(dispatch);
      }
    });

    return unsubscribe;
  }
}

export const syncService = new SyncService();
export default SyncService;
