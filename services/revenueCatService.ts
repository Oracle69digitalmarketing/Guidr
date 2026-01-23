
import { Purchases, PurchasesPackage } from '@revenuecat/purchases-js';

const REVENUECAT_KEYS = {
  web: "goog_placeholder_key", 
};

export interface SubscriptionStatus {
  isPro: boolean;
  entitlements: string[];
}

export const initRevenueCat = async (userId: string) => {
  if (REVENUECAT_KEYS.web === "goog_placeholder_key") {
    console.warn("RevenueCat: Using placeholder key.");
    return;
  }
  
  try {
    Purchases.configure(REVENUECAT_KEYS.web, userId);
  } catch (e) {
    console.error("RevenueCat: Initialization Error", e);
  }
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const purchases = Purchases.getSharedInstance();
    const customerInfo = await purchases.getCustomerInfo();
    const hasPremium = !!customerInfo.entitlements.active['premium'];
    
    return {
      isPro: hasPremium,
      entitlements: Object.keys(customerInfo.entitlements.active)
    };
  } catch (e) {
    return { isPro: false, entitlements: [] };
  }
};

/**
 * Fetches current offerings/packages from RevenueCat dashboard.
 */
export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getSharedInstance().getOfferings();
    return offerings.current;
  } catch (e) {
    console.error("RevenueCat: Failed to fetch offerings", e);
    return null;
  }
};

/**
 * Executes the purchase for a specific package.
 */
export const purchasePackage = async (pack: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.getSharedInstance().purchasePackage(pack);
    return !!customerInfo.entitlements.active['premium'];
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error("RevenueCat: Purchase failed", e);
    }
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.getSharedInstance().restorePurchases();
    return !!customerInfo.entitlements.active['premium'];
  } catch (e) {
    return false;
  }
};
