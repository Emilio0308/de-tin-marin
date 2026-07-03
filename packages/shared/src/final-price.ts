import { roundMoney } from "./prices";

export type CampaignForPricing = {
  percentage: number;
  startsAt: string | Date;
  endsAt: string | Date;
  isActive: boolean;
};

export function isCampaignActive(
  campaign: CampaignForPricing | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!campaign?.isActive) return false;

  const startsAt = new Date(campaign.startsAt);
  const endsAt = new Date(campaign.endsAt);

  return now >= startsAt && now <= endsAt;
}

export function computeFinalPrice(
  netPrice: number,
  campaign: CampaignForPricing | null | undefined,
  now: Date = new Date(),
): number {
  if (!isCampaignActive(campaign, now)) {
    return roundMoney(netPrice);
  }

  const percentage = campaign!.percentage;
  return roundMoney(netPrice * (1 - percentage / 100));
}

export type CampaignSummary = {
  id: string;
  name: string;
  percentage: number;
};

export function toCampaignForPricing(row: {
  percentage: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}): CampaignForPricing {
  return {
    percentage: Number(row.percentage),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
  };
}
