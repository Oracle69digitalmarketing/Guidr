
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RecipeCard from '../components/RecipeCard';
import { getRecipes, auth } from '../firebase';
import { Recipe } from '../types';
import { getSubscriptionStatus, initRevenueCat } from '../services/revenueCatService';

const RecipeBrowse: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const init = async () => {
      // 1. Get current authenticated user
      const user = auth?.currentUser;
      const uid = user?.uid || "anonymous-explorer";
      setUserName(user?.displayName?.split(' ')[0] || "Friend");

      // 2. Initialize RevenueCat with real UID
      await initRevenueCat(uid);

      // 3. Fetch data from services
      const [recipeData, subStatus] = await Promise.all([
        getRecipes(),
        getSubscriptionStatus()
      ]);
      
      setRecipes(recipeData);
      setIsPro(subStatus.isPro);
      setLoading(false);
    };
    init();
  }, []);

  return (
    <Layout 
      title="Guidr" 
      actions={
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-lg"
        >
          <i className="fa-solid fa-gear"></i>
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 py-6 px-4 bg-surface/30 rounded-3xl border border-border/30 backdrop-blur-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary p-[2px]">
              <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center overflow-hidden">
                 <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&backgroundColor=transparent`} 
                    alt="User Profile" 
                  />
              </div>
            </div>
            {isPro && (
              <div className="absolute -top-2 -right-2 bg-primary text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter">
                PRO
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold tracking-tight">Welcome, {userName}!</h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPro ? 'bg-primary animate-pulse' : 'bg-slate-500'}`}></div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                {isPro ? 'Premium Member' : 'Community Member'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1 px-2">
          <h3 className="text-2xl font-bold text-slate-100">Ready to begin?</h3>
          <p className="text-slate-500 text-sm">Pick a coaching space that fits your current need.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <i className="fa-solid fa-heart text-primary text-4xl animate-pulse mb-4"></i>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Checking in...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onSelect={(id) => navigate(`/chat/${id}`)} 
              />
            ))}
          </div>
        )}

        <div className="pt-6">
          <button 
            onClick={() => navigate('/setup')}
            className="w-full py-4 rounded-3xl bg-surface/50 border border-border text-slate-400 hover:border-primary/50 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 group"
          >
            <i className="fa-solid fa-feather group-hover:text-primary transition-colors"></i>
            Refine My Personal Goals
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default RecipeBrowse;
