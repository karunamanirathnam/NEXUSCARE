
import React, { useState, useEffect } from 'react';
import { User, AppNotification } from './types';
import Dashboard from './components/Dashboard';
import AuthPortal from './components/AuthPortal';
import Profile from './components/Profile';
import Header from './components/Header';
import NotificationPage from './components/NotificationPage';
import LandingPage from './components/LandingPage';

type AppView = 'landing' | 'auth' | 'dashboard' | 'profile' | 'notifications';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin-login'>('login');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexuscare_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, []);

  const addNotification = (title: string, message: string, type: 'success' | 'alert' | 'info') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
    localStorage.setItem('nexuscare_session', JSON.stringify(user));
    addNotification('Identity Authenticated', `Secure medical session established for ${user.username}`, 'success');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('nexuscare_session', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('landing');
    localStorage.removeItem('nexuscare_session');
  };

  const openAuth = (mode: 'login' | 'signup' | 'admin-login') => {
    setAuthMode(mode);
    setView('auth');
  };

  return (
    <div className="min-h-screen flex flex-col midnight-bg text-emerald-100">
      {currentUser && (
        <Header 
          user={currentUser} 
          onLogout={handleLogout} 
          onNavigate={(v) => setView(v as AppView)} 
          notificationCount={notifications.length}
        />
      )}
      
      <main className="flex-grow">
        {view === 'landing' && !currentUser && (
          <LandingPage 
            onSignIn={() => openAuth('login')} 
            onCreateAccount={() => openAuth('signup')} 
            onAdminPortal={() => openAuth('admin-login')}
          />
        )}

        {view === 'auth' && !currentUser && (
          <AuthPortal 
            onLogin={handleLogin} 
            onBack={() => setView('landing')}
            initialMode={authMode}
          />
        )}

        {currentUser && (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                user={currentUser} 
                onNotify={addNotification}
              />
            )}

            {view === 'profile' && (
              <Profile 
                user={currentUser} 
                onBack={() => setView('dashboard')} 
                onNotify={addNotification}
                onUserUpdate={handleUserUpdate}
              />
            )}

            {view === 'notifications' && (
              <NotificationPage 
                notifications={notifications} 
                onClear={() => setNotifications([])} 
              />
            )}
          </>
        )}
      </main>

      <footer className="py-10 text-center border-t border-emerald-500/5 bg-black/40">
        <p className="text-emerald-900 text-[10px] font-black uppercase tracking-[0.5em] italic">
          &copy; {new Date().getFullYear()} NexusCare Systems | AWS Cloud Healthcare Cluster | HIPAA-Aligned IAM
        </p>
      </footer>
    </div>
  );
};

export default App;
