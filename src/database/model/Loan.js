import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Loan extends Model {
  static table = 'loans';

  @field('name') name;
  @field('mobile_number') mobileNumber;
  @field('aadhaar_number') aadhaarNumber;
  @field('address') address;
  @field('amount') amount;
  @field('purpose') purpose;
  @field('loan_mode') loanMode;

  @field('loan_start_date') loanStartDate;
  @field('loan_end_date') loanEndDate;
  @field('sync_status') syncStatus;
  @field('proof') proof;
  @field('interest_rate') interestRate;
}
