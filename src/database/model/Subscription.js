import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Subscription extends Model {
  static table = 'subscriptions';

  @field('has_active_plan') hasActivePlan;
  @field('plan_id') planId;
  @field('purchase_date') purchaseDate;
  @field('expiry_date') expiryDate;
  @field('remaining_days') remainingDays;
  @field('is_active') isActive;
}
