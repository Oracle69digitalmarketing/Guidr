
import { Purchases as PurchasesJS, Package as PackageJS } from '@revenuecat/purchases-js';
import { Purchases as PurchasesCapacitor } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_KEYS = {
  web: import.meta.env.VITE_REVENUECAT_API_KEY || "goog_placeholder_key",
};

export interface SubscriptionStatus {
  isPro: boolean;
  entitlements: string[];
}

const isNative = Capacitor.isNativePlatform();

export const initRevenueCat = async (userId: string) => {
  if (isNative) {
    try {
      // For native, we rely on the platform-specific key or just the userId if already configured in native code
      // However, we can also configure it here for completeness
      await PurchasesCapacitor.configure({
        apiKey: REVENUECAT_KEYS.web, // In a real app, use the Android/iOS specific key
        appUserID: userId
      });
    } catch (e) {
      console.error("RevenueCat Capacitor: Init Error", e);
    }
  } else {
    if (REVENUECAT_KEYS.web === "goog_placeholder_key") return;
    try {
      PurchasesJS.configure(REVENUECAT_KEYS.web, userId);
    } catch (e) {
      console.error("RevenueCat JS: Init Error", e);
    }
  }
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const customerInfo = isNative
      ? await PurchasesCapacitor.getCustomerInfo()
      : await PurchasesJS.getSharedInstance().getCustomerInfo();

    const activeEntitlements = isNative
      ? Object.keys((customerInfo as any).entitlements.active)
      : Object.keys((customerInfo as any).entitlements.active);

    const hasPremium = isNative
      ? !!(customerInfo as any).entitlements.active['premium']
      : !!(customerInfo as any).entitlements.active['premium'];

    return {
      isPro: hasPremium,
      entitlements: activeEntitlements
    };
  } catch (e) {
    console.error("RevenueCat: Status Error", e);
    return { isPro: false, entitlements: [] };
  }
};

export const getOfferings = async () => {
  try {
    if (isNative) {
      const offerings = await PurchasesCapacitor.getOfferings();
      return offerings.current;
    } else {
      const offerings = await PurchasesJS.getSharedInstance().getOfferings();
      return offerings.current;
    }
  } catch (e) {
    console.error("RevenueCat: Offerings Error", e);
    return null;
  }
};

export const purchasePackage = async (pack: any) => {
  try {
    if (isNative) {
      const { customerInfo } = await PurchasesCapacitor.purchasePackage({
        aPackage: pack
      });
      return !!customerInfo.entitlements.active['premium'];
    } else {
      const { customerInfo } = await PurchasesJS.getSharedInstance().purchase({
        rcPackage: pack as PackageJS
      });
      return !!customerInfo.entitlements.active['premium'];
    }
  } catch (e: any) {
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = isNative
      ? await PurchasesCapacitor.restorePurchases()
      : await PurchasesJS.getSharedInstance().getCustomerInfo();
    return !!(customerInfo as any).entitlements.active['premium'];
  } catch (e) {
    return false;
  }
};
