package com.guidr.app

import android.os.Bundle
import android.util.Log
import com.getcapacitor.BridgeActivity
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.interfaces.ReceiveCustomerInfoCallback
import com.revenuecat.purchases.models.StoreProduct
import com.revenuecat.purchases.models.StoreTransaction
import com.revenuecat.purchases.Offerings
import com.revenuecat.purchases.PurchasesError
import com.revenuecat.purchases.ui.revenuecatui.PaywallActivityLauncher
import com.revenuecat.purchases.ui.revenuecatui.PaywallResult
import com.revenuecat.purchases.ui.revenuecatui.helpers.PaywallResultHandler
import com.revenuecat.purchases.ui.revenuecatui.CustomerInfoActivity

import com.revenuecat.purchases.interfaces.PurchasesListener

class MainActivity : BridgeActivity(), PurchasesListener {
    private val TAG = "MainActivity"
    private lateinit var paywallLauncher: PaywallActivityLauncher

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Purchases.sharedInstance.purchasesListener = this

        // Initialize Paywall Launcher
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

        // Check entitlement on start
        checkEntitlements()
    }

    private fun checkEntitlements() {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                val isPro = customerInfo.entitlements["Guidr Pro"]?.isActive == true
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
        paywallLauncher.launch()
    }

    // Public method to show Customer Center
    fun showCustomerCenter() {
        CustomerInfoActivity.Builder(this).build().launch()
    }

    override fun onReceiveCustomerInfo(customerInfo: CustomerInfo) {
        Log.d(TAG, "Customer Info updated: $customerInfo")
        // Handle updated customer info, e.g., update UI
        checkEntitlements() // Re-check entitlements when customer info changes
    }

    fun fetchOfferings(callback: (offerings: Offerings?) -> Unit) {
        Purchases.sharedInstance.getOfferingsWith(
            onError = { error ->
                Log.e(TAG, "Error fetching offerings: ${error.message}")
                callback(null)
            },
            onSuccess = { offerings ->
                Log.d(TAG, "Offerings fetched: $offerings")
                callback(offerings)
            }
        )
    }

    fun purchaseProduct(product: StoreProduct, callback: (customerInfo: CustomerInfo?, error: PurchasesError?) -> Unit) {
        Purchases.sharedInstance.purchase(
            this,
            product,
            onError = { error, _ ->
                Log.e(TAG, "Error purchasing product: ${error.message}")
                callback(null, error)
            },
            onSuccess = { storeTransaction, customerInfo ->
                Log.d(TAG, "Purchase successful: $storeTransaction, $customerInfo")
                callback(customerInfo, null)
            }
        )
    }

    fun restorePurchases(callback: (customerInfo: CustomerInfo?, error: PurchasesError?) -> Unit) {
        Purchases.sharedInstance.restorePurchasesWith(
            onError = { error ->
                Log.e(TAG, "Error restoring purchases: ${error.message}")
                callback(null, error)
            },
            onSuccess = { customerInfo ->
                Log.d(TAG, "Purchases restored: $customerInfo")
                callback(customerInfo, null)
            }
        )
    }
}
