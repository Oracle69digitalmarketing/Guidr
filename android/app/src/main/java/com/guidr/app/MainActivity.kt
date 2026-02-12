package com.guidr.app

import android.os.Bundle
import android.util.Log
import com.getcapacitor.BridgeActivity
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.interfaces.ReceiveCustomerInfoCallback
import com.revenuecat.purchases.models.StoreProduct
import com.revenuecat.purchases.models.StoreTransaction
// import com.revenuecat.purchases.ui.revenuecatui.PaywallActivityLauncher
// import com.revenuecat.purchases.ui.revenuecatui.PaywallResult
// import com.revenuecat.purchases.ui.revenuecatui.helpers.PaywallResultHandler

class MainActivity : BridgeActivity() {
    private val TAG = "MainActivity"
    // private lateinit var paywallLauncher: PaywallActivityLauncher

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Paywall Launcher
        /*
        paywallLauncher = PaywallActivityLauncher(this, object : PaywallResultHandler {
            override fun onActivityResult(result: PaywallResult) {
                when (result) {
                    is PaywallResult.Purchased -> {
                        Log.d(TAG, "Purchase successful: ${result.customerInfo}")
                    }
                    is PaywallResult.Cancelled -> {
                        Log.d(TAG, "Purchase cancelled")
                    }
                    is PaywallResult.Error -> {
                        Log.e(TAG, "Purchase error: ${result.error}")
                    }
                    is PaywallResult.Restored -> {
                        Log.d(TAG, "Purchase restored: ${result.customerInfo}")
                    }
                }
            }
        })
        */

        // Check entitlement on start
        checkEntitlements()
    }

    private fun checkEntitlements() {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                val isPro = customerInfo.entitlements["premium"]?.isActive == true
                if (!isPro) {
                    Log.d(TAG, "User is not Pro. We could show paywall here.")
                    // To show paywall: paywallLauncher.launch()
                } else {
                    Log.d(TAG, "User is Pro!")
                }
            }

            override fun onError(error: com.revenuecat.purchases.PurchasesError) {
                Log.e(TAG, "Error fetching customer info: $error")
            }
        })
    }

    // Public method to show paywall (could be called from a Capacitor plugin)
    fun showPaywall() {
        // paywallLauncher.launch()
    }

    // Public method to show Customer Center
    fun showCustomerCenter() {
        // Customer Center is available in newer versions of the SDK
        // You can use the RevenueCatUI components to show it.
        // For now, we'll log it as a placeholder.
        Log.d(TAG, "Showing Customer Center...")
    }
}
