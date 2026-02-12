import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getOfferings, purchasePackage, restorePurchases } from '../services/revenueCatService';
import { Offering, Package, PackageType } from '@revenuecat/purchases-js';

const Paywall: React.FC = () => {
  const navigate = useNavigate();
  const [offering, setOffering] = useState<Offering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const off = await getOfferings();
      setOffering(off);
      setLoading(false);
    };
    load();
  }, []);

  const handlePurchase = async (pkg: Package) => {
    setPurchasing(true);
    const success = await purchasePackage(pkg);
    if (success) {
      navigate('/', { replace: true });
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    const success = await restorePurchases();
    if (success) navigate('/');
    setLoading(false);
  };

  const benefits = [
    { icon: 'fa-brain', text: 'Unlock all 15+ specialized coaches' },
    { icon: 'fa-cloud', text: 'Cloud sync across all your devices' },
    { icon: 'fa-history', text: 'Unlimited conversation history' },
    { icon: 'fa-shield-halved', text: 'Priority access to new AI models' }
  ];

  return (
    <Layout title="Guidr Pro" showBack onBack={() => navigate(-1)}>
      <div className="flex-1 flex flex-col items-center justify-center py-6 px-2 text-center space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
            <i className="fa-solid fa-crown text-white text-4xl"></i>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background border border-border px-3 py-1 rounded-full">
            <span className="text-[10px] font-black tracking-widest uppercase">Premium</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Level Up Your Life</h2>
          <p className="text-slate-400 max-w-[280px] mx-auto text-sm">Join thousands of high-performers using Guidr Pro to stay sharp.</p>
        </div>

        <div className="w-full grid gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4 bg-surface/50 border border-border/50 p-4 rounded-2xl text-left">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <i className={`fa-solid ${b.icon} text-primary text-xs`}></i>
              </div>
              <span className="text-sm font-medium text-slate-200">{b.text}</span>
            </div>
          ))}
        </div>

        <div className="w-full pt-4 space-y-4">
          {loading ? (
             <div className="py-8 animate-pulse text-slate-600 text-xs font-bold uppercase">Loading Plans...</div>
          ) : offering?.availablePackages.map((pkg) => (
            <button
              key={pkg.identifier}
              disabled={purchasing}
              onClick={() => handlePurchase(pkg)}
              className="w-full bg-gradient-primary p-6 rounded-3xl text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                    {pkg.packageType === 'ANNUAL' || pkg.packageType === PackageType.Annual ? 'Best Value' : 'Monthly Access'}
                  </p>
                  <p className="text-xl font-bold">{pkg.product?.title || pkg.rcBillingProduct?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{pkg.product?.priceString || pkg.rcBillingProduct?.currentPrice?.formattedPrice}</p>
                  <p className="text-[10px] opacity-70">No hidden fees</p>
                </div>
              </div>
            </button>
          ))}
          
          {!loading && !offering && (
            <div className="p-6 bg-surface border border-dashed border-border rounded-2xl text-slate-500 text-xs">
              No active plans found. Please check RevenueCat configuration.
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={handleRestore}
              className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
            >
              Restore Purchases
            </button>
            <p className="text-[9px] text-slate-600 leading-relaxed px-8">
              Subscriptions will automatically renew unless canceled within 24-hours before the end of the current period.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Paywall;
