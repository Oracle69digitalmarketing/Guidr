
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { UserContext } from '../types';
import { saveUserContext, auth } from '../firebase';

const ContextSetup: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [context, setContext] = useState<UserContext>(() => {
    const saved = localStorage.getItem('user_context');
    return saved ? JSON.parse(saved) : { quarterlyGoal: "", weeklySentiment: "" };
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Pass context exactly as required by the backend
    const success = await saveUserContext(context);
    
    if (success) {
      localStorage.setItem('user_context', JSON.stringify(context));
      navigate('/');
    } else {
      alert("I couldn't save your updates. Please check your connection.");
    }
    setIsSaving(false);
  };

  const isValid = context.quarterlyGoal.trim() && context.weeklySentiment.trim();

  return (
    <Layout 
      title="Personal Context" 
      showBack 
      onBack={() => navigate('/')}
    >
      <div className="space-y-6 py-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Set Your Context</h2>
          <p className="text-slate-500 text-sm">Help your coach understand your current focus.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-300">
              My big goal this quarter is...
            </label>
            <textarea
              value={context.quarterlyGoal}
              onChange={(e) => setContext({ ...context, quarterlyGoal: e.target.value })}
              placeholder="e.g., Launching my startup, running a marathon..."
              className="w-full bg-input border border-border focus:border-primary rounded-xl p-4 text-slate-100 min-h-[120px] outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-300">
              Last week, I felt generally...
            </label>
            <textarea
              value={context.weeklySentiment}
              onChange={(e) => setContext({ ...context, weeklySentiment: e.target.value })}
              placeholder="e.g., Productive but tired, very optimistic..."
              className="w-full bg-input border border-border focus:border-primary rounded-xl p-4 text-slate-100 min-h-[120px] outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || isSaving}
            className="w-full py-4 rounded-xl bg-gradient-primary font-bold text-white shadow-lg disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
          >
            {isSaving ? "Saving..." : "Save Context"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ContextSetup;
