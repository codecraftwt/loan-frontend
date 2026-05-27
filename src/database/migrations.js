import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 3,
      steps: [
        createTable({
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
    },
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'loans',
          columns: [
            { name: 'interest_rate', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
})