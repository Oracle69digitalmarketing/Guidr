
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import RecipeBrowse from './pages/RecipeBrowse';
import ContextSetup from './pages/ContextSetup';
import CoachChat from './pages/CoachChat';
import Settings from './pages/Settings';
import Paywall from './pages/Paywall';
import Auth from './pages/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-slate-100">
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <RecipeBrowse /> : <Navigate to="/auth" />} />
          <Route path="/setup" element={user ? <ContextSetup /> : <Navigate to="/auth" />} />
          <Route path="/chat/:recipeId" element={user ? <CoachChat /> : <Navigate to="/auth" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" />} />
          <Route path="/paywall" element={user ? <Paywall /> : <Navigate to="/auth" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
