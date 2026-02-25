/**
 * Bilingual labels for subscription status UI components.
 *
 * WHY: All MediLink UI text must be bilingual (Vietnamese primary,
 * English secondary). Centralizing labels prevents duplication and
 * ensures consistency across badge, banner, and overlay components.
 *
 * vi: "Nhan song ngu cho giao dien trang thai dang ky"
 * en: "Bilingual labels for subscription status UI"
 */

import type { SubscriptionStatus } from "./types";

interface BilingualLabel {
  vi: string;
  en: string;
}

interface StatusLabel extends BilingualLabel {
  variant: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Status badge labels and variants for each subscription state.
 * vi: "Nhan trang thai va variant cho moi trang thai dang ky"
 * en: "Status labels and variants for each subscription state"
 */
export const STATUS_LABELS: Record<SubscriptionStatus, StatusLabel> = {
  active: {
    vi: "Hoat dong",
    en: "Active",
    variant: "default",
  },
  trial: {
    vi: "Dung thu",
    en: "Trial",
    variant: "secondary",
  },
  grace_period: {
    vi: "Gia han",
    en: "Grace Period",
    variant: "outline",
  },
  expired: {
    vi: "Het han",
    en: "Expired",
    variant: "destructive",
  },
  suspended: {
    vi: "Tam ngung",
    en: "Suspended",
    variant: "outline",
  },
};

/**
 * Banner and overlay text labels.
 * vi: "Nhan van ban cho banner va overlay"
 * en: "Text labels for banners and overlays"
 */
export const BILLING_LABELS = {
  gracePeriodTitle: {
    vi: "Dang ky da het han",
    en: "Your subscription has expired",
  } satisfies BilingualLabel,

  gracePeriodDescription: (daysRemaining: number): BilingualLabel => ({
    vi: `Ban co ${daysRemaining} ngay xem du lieu. Sau do, truy cap se bi han che.`,
    en: `You have ${daysRemaining} days of read-only access. After that, access will be restricted.`,
  }),

  gracePeriodCta: {
    vi: "Lien he gia han",
    en: "Contact to renew",
  } satisfies BilingualLabel,

  expiredTitle: {
    vi: "Dang ky da het han",
    en: "Subscription Expired",
  } satisfies BilingualLabel,

  expiredDescription: {
    vi: "Thoi gian gia han da ket thuc. Du lieu cua ban duoc bao toan nhung truy cap bi han che.",
    en: "Your grace period has ended. Your data is preserved but access is restricted.",
  } satisfies BilingualLabel,

  expiredContactCta: {
    vi: "Lien he MediLink",
    en: "Contact MediLink",
  } satisfies BilingualLabel,

  expiredRenewalCta: {
    vi: "Gui yeu cau gia han",
    en: "Send renewal request",
  } satisfies BilingualLabel,

  expiredHotline: "Hotline: 1900-xxxx | Email: billing@medilink.vn",

  suspendedTitle: {
    vi: "Tai khoan tam ngung",
    en: "Account Suspended",
  } satisfies BilingualLabel,

  suspendedDescription: {
    vi: "Tai khoan to chuc cua ban da bi tam ngung boi quan tri vien he thong. Vui long lien he ho tro de biet them chi tiet.",
    en: "Your organization account has been suspended by the system administrator. Please contact support for more information.",
  } satisfies BilingualLabel,

  suspendedCta: {
    vi: "Lien he ho tro",
    en: "Contact Support",
  } satisfies BilingualLabel,

  trialRemaining: (daysRemaining: number): BilingualLabel => ({
    vi: `Dung thu con ${daysRemaining} ngay. Nang cap de tiep tuc su dung.`,
    en: `${daysRemaining} days left in your trial.`,
  }),

  trialUpgradeCta: {
    vi: "Nang cap ngay",
    en: "Upgrade now",
  } satisfies BilingualLabel,

  readOnlyTooltip: {
    vi: "Chi doc trong thoi gian gia han",
    en: "Read-only during grace period",
  } satisfies BilingualLabel,

  daysRemaining: (days: number): BilingualLabel => ({
    vi: `con ${days} ngay`,
    en: `${days} days left`,
  }),
} as const;
