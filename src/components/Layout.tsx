
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBack, onBack, actions }) => {
  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <i className="fa-solid fa-chevron-left text-primary"></i>
            </button>
          )}
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        <div>{actions}</div>
      </header>
      <main className="flex-1 flex flex-col p-4 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
