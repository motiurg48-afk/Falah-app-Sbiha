'use client';
import { supabase } from './supabase';

export type RewardConfig = {
  enabled: boolean;
  pointsPerRsSpent: number;       // points earned per 1 ₹ spent
  pointValueInRs: number;         // value of 1 point in ₹
  minCartTotalToRedeem: number;   // minimum cart subtotal in ₹ to allow redemption
};

export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  enabled: false,
  pointsPerRsSpent: 50 / 1000,    // 50 points per ₹1000 → 0.05 pts/₹
  pointValueInRs: 0.25,
  minCartTotalToRedeem: 2000,
};

const SETTINGS_KEY = 'reward_points_config';

export async function loadRewardConfig(): Promise<RewardConfig> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (error || !data?.value) return { ...DEFAULT_REWARD_CONFIG };
    const parsed = JSON.parse(data.value as string);
    return { ...DEFAULT_REWARD_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_REWARD_CONFIG };
  }
}

export async function saveRewardConfig(config: RewardConfig) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: SETTINGS_KEY, value: JSON.stringify(config), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export type CustomerPoints = {
  id: string;
  phone: string;
  points: number;
  spent_total: number;
};

export async function getCustomerPoints(phone: string): Promise<CustomerPoints | null> {
  if (!phone) return null;
  const clean = normalizePhone(phone);
  const { data, error } = await supabase
    .from('customer_reward_points')
    .select('*')
    .eq('phone', clean)
    .maybeSingle();
  if (error || !data) return null;
  return data as CustomerPoints;
}

export async function addRewardPoints(phone: string, spentAmount: number) {
  if (!phone || spentAmount <= 0) return;
  const config = await loadRewardConfig();
  if (!config.enabled) return;
  const earned = Math.floor(spentAmount * config.pointsPerRsSpent);
  if (earned <= 0) return;
  const clean = normalizePhone(phone);
  // upsert: add points + spent to existing or create new row
  const existing = await getCustomerPoints(phone);
  if (existing) {
    await supabase
      .from('customer_reward_points')
      .update({
        points: existing.points + earned,
        spent_total: existing.spent_total + spentAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('customer_reward_points')
      .insert({
        phone: clean,
        points: earned,
        spent_total: spentAmount,
        updated_at: new Date().toISOString(),
      });
  }
}

export function calculateEarnedPoints(cartTotal: number, config: RewardConfig): number {
  if (!config.enabled || cartTotal <= 0) return 0;
  return Math.floor(cartTotal * config.pointsPerRsSpent);
}

export function maxRedeemablePoints(availablePoints: number, cartTotal: number, config: RewardConfig): number {
  if (!config.enabled || !config.pointValueInRs || config.pointValueInRs <= 0) return 0;
  const maxByValue = Math.floor(cartTotal / config.pointValueInRs);
  return Math.max(0, Math.min(availablePoints, maxByValue));
}

export function pointsToRupees(points: number, config: RewardConfig): number {
  return Math.round(points * config.pointValueInRs);
}

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) digits = '91' + digits;
  if (digits.startsWith('91') && digits.length === 12) digits = '+' + digits;
  if (!digits.startsWith('+')) digits = '+' + digits;
  return digits;
}