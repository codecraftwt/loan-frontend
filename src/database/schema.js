import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 3,

  tables: [
    tableSchema({
      name: 'loans',

      columns: [
        { name: 'name', type: 'string' },
        { name: 'mobile_number', type: 'string' },
        { name: 'aadhaar_number', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'purpose', type: 'string' },
        { name: 'loan_mode', type: 'string' },

        { name: 'loan_start_date', type: 'string' },
        { name: 'loan_end_date', type: 'string' },

        { name: 'sync_status', type: 'string' },
        { name: 'proof', type: 'string', isOptional: true },
        { name: 'interest_rate', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'subscriptions',
      columns: [
        { name: 'has_active_plan', type: 'boolean' },
        { name: 'plan_id', type: 'string', isOptional: true },
        { name: 'purchase_date', type: 'string', isOptional: true },
        { name: 'expiry_date', type: 'string', isOptional: true },
        { name: 'remaining_days', type: 'number', isOptional: true },
        { name: 'is_active', type: 'boolean' },
      ],
    }),
  ],
});
