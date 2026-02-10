
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, isConfigured } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isConfigured) {
      setError("Firebase keys missing. Please configure your project in firebase.ts");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth!, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex w-20 h-20 bg-gradient-primary rounded-3xl items-center justify-center shadow-2xl shadow-primary/20 transform -rotate-6">
            <i className="fa-solid fa-feather-pointed text-white text-4xl"></i>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-white">Oracle69</h1>
            <p className="text-slate-500 font-medium">Your space for clarity and growth.</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-primary rounded-xl text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">Securely powered by Firebase</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
