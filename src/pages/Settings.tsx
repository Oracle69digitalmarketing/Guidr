
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import Layout from '../components/Layout';
import { auth, isConfigured as fbConfigured } from '../firebase';
import { getSubscriptionStatus } from '../services/revenueCatService';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = auth?.currentUser;

  useEffect(() => {
    const checkStatus = async () => {
      const status = await getSubscriptionStatus();
      setIsPro(status.isPro);
      setLoading(false);
    };
    checkStatus();
  }, []);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      navigate('/auth');
    }
  };

  return (
    <Layout title="Account" showBack onBack={() => navigate('/')}>
      <div className="space-y-8 py-4">
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Profile</h3>
          <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary p-[2px]">
              <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center overflow-hidden">
                 <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || 'User'}&backgroundColor=transparent`} 
                    alt="User Profile" 
                  />
              </div>
            </div>
            <div>
              <p className="font-bold text-lg">{user?.displayName || "Member"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Subscription</h3>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Current Tier</p>
                <p className="text-xs text-slate-500">
                  {isPro ? "Oracle69 Pro (Unlimited Access)" : "Free Community Member"}
                </p>
              </div>
              {!isPro && (
                <button 
                  onClick={() => navigate('/paywall')}
                  className="px-4 py-2 bg-gradient-primary text-white text-[10px] font-black uppercase rounded-lg shadow-lg"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Support & Legal</h3>
           <div className="grid gap-2">
             <button className="w-full bg-surface border border-border rounded-xl p-4 text-left text-sm font-medium hover:border-slate-500 transition-colors">
               Contact Coaching Support
             </button>
             <button className="w-full bg-surface border border-border rounded-xl p-4 text-left text-sm font-medium hover:border-slate-500 transition-colors">
               Terms of Service
             </button>
             <button className="w-full bg-surface border border-border rounded-xl p-4 text-left text-sm font-medium hover:border-slate-500 transition-colors">
               Privacy Policy
             </button>
           </div>
        </section>

        <section className="pt-4">
          <button 
            onClick={handleSignOut}
            className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            Sign Out
          </button>
        </section>

        <div className="text-center space-y-2 py-10 opacity-30">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">Oracle69 v1.3.0</p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
