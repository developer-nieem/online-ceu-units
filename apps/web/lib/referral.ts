import { apiFetch } from './api';

export type ReferralDetail = {
  referralId: string;
  refereeName: string;
  refereeEmail: string;
  status: string;
  packagePurchased: string | null;
  convertedAt: string | null;
  rewardAmountCents: number | null;
  rewardExpiresAt: string | null;
  createdAt: string;
};

export type ReferralStats = {
  referralCode: string;
  referralLink: string;
  stats: {
    pending: number;
    converted: number;
    rewarded: number;
    totalRewardCents: number;
  };
  referrals: ReferralDetail[];
};

export async function fetchReferralStats() {
  return apiFetch<ReferralStats>('/referrals/my-stats');
}
