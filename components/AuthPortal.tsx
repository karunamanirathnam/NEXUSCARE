
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/apiService';

interface AuthPortalProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  initialMode?: 'login' | 'signup' | 'admin-login';
}

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin, onBack, initialMode = 'login' }) => {
  // Map initialMode to simplified AuthMode
  const startMode: AuthMode = initialMode === 'admin-login' ? 'login' : initialMode as AuthMode;
  
  const [mode, setMode] = useState<AuthMode>(startMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialMode === 'admin-login' ? UserRole.ADMIN : UserRole.PATIENT);
  const [showTerms, setShowTerms] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    securityQuestion: 'What was your first pet name?',
    securityAnswer: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerAuthFlow = (e: React.FormEvent) => {
    e.preventDefault();
    setShowTerms(true);
  };

  const executeAuth = async () => {
    setShowTerms(false);
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const result = await api.signup({ ...formData, role: selectedRole });
        if (result.success) {
          setSuccessMsg(`Identity Provisioned. Access your ${selectedRole === UserRole.ADMIN ? 'Admin console' : 'Patient portal'} via the login interface.`);
          setMode('login');
        } else {
          setError(result.message);
        }
      } 
      else {
        const result = await api.login({ email: formData.email, password: formData.password });
        if (result.success) {
          const user = result.user;
          // Security enforcement: Ensure role match
          if (selectedRole === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
            setError('ACCESS DENIED: Credentials do not have Administrative clearance.');
            setLoading(false);
            return;
          }
          if (selectedRole === UserRole.PATIENT && user.role === UserRole.ADMIN) {
             // Allow admin to login as patient if they want, but usually we prefer strict switching
          }
          onLogin(user);
        } else {
          setError(result.message);
        }
      } 
    } catch (err) {
      setError('Connection Timeout: Cloud Registry offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 midnight-bg relative transition-all duration-500`}>
      <button 
        onClick={onBack}
        className="fixed top-8 left-8 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl flex items-center justify-center transition-all z-50 shadow-xl active:scale-90"
      >
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="mb-10 text-center w-full max-w-lg">
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
          NEXUS<span className="text-emerald-500">CARE</span>
        </h1>
        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em]">
          {selectedRole === UserRole.ADMIN ? 'Hospital System Master Console' : 'Secure Patient Identity Hub'}
        </p>
      </div>

      <div className={`glass w-full max-w-lg p-12 rounded-[4rem] border-emerald-500/20 shadow-2xl transition-all ${selectedRole === UserRole.ADMIN ? 'border-emerald-500/40 ring-1 ring-emerald-500/10' : ''}`}>
        
        {/* IDENTITY PROTOCOL SELECTOR */}
        <div className="mb-10 space-y-3">
          <label className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.3em] ml-2">Identity Protocol</label>
          <div className="p-1 bg-black/40 rounded-3xl flex gap-1 border border-emerald-500/10">
            <button 
              type="button"
              onClick={() => setSelectedRole(UserRole.PATIENT)}
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.PATIENT ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-emerald-900 hover:text-emerald-500'}`}
            >
              Patient
            </button>
            <button 
              type="button"
              onClick={() => setSelectedRole(UserRole.ADMIN)}
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRole === UserRole.ADMIN ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-emerald-900 hover:text-emerald-500'}`}
            >
              Administrator
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-2xl animate-in shake">
            <i className="fas fa-triangle-exclamation mr-2"></i> {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-8 p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-2xl">
            <i className="fas fa-check-circle mr-2"></i> {successMsg}
          </div>
        )}

        <form onSubmit={triggerAuthFlow} className="space-y-6">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Legal Name</label>
              <input type="text" required className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all placeholder-emerald-900 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={selectedRole === UserRole.ADMIN ? 'Admin Full Name' : 'Patient Full Name'} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">
              {selectedRole === UserRole.ADMIN ? 'Administrator Email ID' : 'Personal Email Address'}
            </label>
            <input 
              type="email" 
              required 
              className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all placeholder-emerald-900 shadow-inner" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder={selectedRole === UserRole.ADMIN ? 'admin@nexus.io' : 'personal@email.com'} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Secure Passkey</label>
            <input type="password" required className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all placeholder-emerald-900 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
          </div>

          {mode === 'signup' && (
            <div className="space-y-4 pt-4 border-t border-emerald-500/10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Security Challenge</label>
                <select className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all" value={formData.securityQuestion} onChange={e => setFormData({...formData, securityQuestion: e.target.value})}>
                  <option>What was your first pet name?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What is your city of birth?</option>
                </select>
              </div>
              <input type="text" required className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all placeholder-emerald-900 shadow-inner" value={formData.securityAnswer} onChange={e => setFormData({...formData, securityAnswer: e.target.value})} placeholder="Secret answer..." />
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 disabled:opacity-50 ${selectedRole === UserRole.ADMIN ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950'}`}>
            {loading ? <i className="fas fa-spinner animate-spin"></i> : mode === 'signup' ? 'Create Medical Identity' : 'Authenticate Session'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-emerald-500/10 text-center">
          {mode === 'login' ? (
            <p className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">
              New to NexusCare? <button type="button" onClick={() => setMode('signup')} className="text-emerald-500 hover:underline">Provision Your Identity</button>
            </p>
          ) : (
            <button type="button" onClick={() => setMode('login')} className="text-[9px] font-black text-emerald-900 hover:text-emerald-500 uppercase tracking-widest">Return to Identity Sync</button>
          )}
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass w-full max-w-lg rounded-[4rem] p-12 border-emerald-500/20 text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-emerald-950 text-2xl mx-auto mb-8 shadow-glow-emerald">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-6">Security Protocol</h3>
            <p className="text-[11px] font-medium text-emerald-100/70 leading-relaxed mb-10 uppercase tracking-widest">
              By proceeding, you authorize NexusCare to sync your encrypted {selectedRole === UserRole.ADMIN ? 'Administrative' : 'Personal'} identity with AWS cloud clusters. All actions are logged.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowTerms(false)} className="flex-1 py-5 bg-emerald-950 text-emerald-800 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-emerald-500/10 hover:bg-emerald-900 transition-colors">Abort</button>
              <button onClick={executeAuth} className="flex-1 py-5 bg-emerald-500 text-emerald-950 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Agree & Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPortal;
