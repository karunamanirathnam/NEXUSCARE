
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Appointment, Doctor, AppointmentStatus } from '../types';
import { SPECIALTIES } from '../constants';
import { api } from '../services/apiService';
import Sidebar from './Sidebar';
import CalendarView from './CalendarView';
import SupportHub from './SupportHub';

interface DashboardProps {
  user: User;
  onNotify: (title: string, message: string, type: 'success' | 'alert' | 'info') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNotify }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isProvisioningDoc, setIsProvisioningDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Specialist management state
  const specialistsRef = useRef<HTMLElement>(null);

  const [bookingForm, setBookingForm] = useState({ 
    patientName: '', 
    patientEmail: '', 
    date: '', 
    time: '', 
    contact: '',
    doctorId: '' 
  });

  const [docForm, setDocForm] = useState({
    name: '',
    specialty: SPECIALTIES[0],
    experience: '',
    bio: '',
    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
  });

  const isAdmin = user.role === UserRole.ADMIN;

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const targetDocId = selectedDoctor?.id || bookingForm.doctorId;
    if (targetDocId && bookingForm.date) {
      fetchAvailability(targetDocId, bookingForm.date);
    } else {
      setAvailableSlots([]);
    }
  }, [bookingForm.date, bookingForm.doctorId, selectedDoctor]);

  const fetchAvailability = async (docId: string, date: string) => {
    setIsLoadingSlots(true);
    try {
      const slots = await api.getDoctorAvailability(docId, date);
      setAvailableSlots(slots);
    } catch (err) {
      onNotify('Sync Error', 'AWS cloud latency detected.', 'alert');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const refreshData = async () => {
    try {
      const [docs, apps] = await Promise.all([api.getDoctors(), api.getAppointments()]);
      setDoctors(docs);
      setAppointments(apps);
      if (isAdmin) {
        const users = await api.getAllUsers();
        setAllUsers(users);
      }
    } catch (err) {
      onNotify('AWS Sync', 'Re-establishing secure channel...', 'info');
    }
  };

  const handleCommitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetDoc = selectedDoctor || doctors.find(d => d.id === bookingForm.doctorId);
    if (!targetDoc) return;

    const payload = {
      patientId: isAdmin ? `ADMIN-PROVISIONED-${Date.now()}` : user.id,
      patientName: isAdmin ? bookingForm.patientName : user.username,
      patientEmail: isAdmin ? bookingForm.patientEmail : user.email,
      patientContact: bookingForm.contact,
      doctorId: targetDoc.id,
      doctorName: targetDoc.name,
      specialty: targetDoc.specialty,
      date: bookingForm.date,
      time: bookingForm.time
    };

    try {
      const result = await api.bookAppointment(payload);
      if (result.success) {
        setIsBookingModalOpen(false);
        onNotify('Visit Confirmed', 'Appointment successfully logged in the medical record system.', 'success');
        refreshData();
      } else {
        onNotify('Conflict', result.message || 'This time slot is no longer available.', 'alert');
      }
    } catch (err) {
      onNotify('System Error', 'Could not establish connection to the appointment server.', 'alert');
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        await api.updateDoctor(editingDoc.id, { ...docForm, availability: editingDoc.availability });
        onNotify('Registry Updated', `Specialist credentials for ${docForm.name} modified successfully.`, 'success');
      } else {
        await api.addDoctor({
          ...docForm,
          availability: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
        });
        onNotify('Specialist Registered', `${docForm.name} added to the hospital directory.`, 'success');
      }
      setIsProvisioningDoc(false);
      setEditingDoc(null);
      setDocForm({
        name: '',
        specialty: SPECIALTIES[0],
        experience: '',
        bio: '',
        imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
      });
      refreshData();
    } catch (err) {
      onNotify('Registry Error', 'Failed to synchronize specialist data.', 'alert');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('CAUTION: Permanently remove this specialist from the directory?')) return;
    try {
      await api.deleteDoctor(id);
      onNotify('Registry Updated', 'Specialist successfully removed from the platform.', 'info');
      refreshData();
    } catch (err) {
      onNotify('Update Failed', 'Operation interrupted by system policy.', 'alert');
    }
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(id, status);
      onNotify('Status Update', `Appointment ${id} marked as ${status}.`, 'info');
      refreshData();
    } catch (err) {
      onNotify('Update Error', 'Failed to sync status change.', 'alert');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const result = await api.updateUserRole(userId, newRole);
      if (result.success) {
        onNotify('IAM Update', `Permissions for user ${userId} updated to ${newRole}.`, 'success');
        refreshData();
      } else {
        onNotify('Update Failed', 'System denied role modification.', 'alert');
      }
    } catch (err) {
      onNotify('Update Failed', 'API connection error during role update.', 'alert');
    }
  };

  const patientAppointments = appointments.filter(a => a.patientId === user.id);

  return (
    <div className="flex midnight-bg min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} />
      
      <main className="flex-grow md:ml-64 p-6 md:p-10 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-emerald-950/20 p-10 rounded-[3.5rem] border border-emerald-500/10 relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full mb-4 inline-block border border-emerald-500/20 shadow-glow-emerald">
                {isAdmin ? 'HOSPITAL ADMINISTRATION' : 'PATIENT CARE PORTAL'}
              </span>
              <h1 className="text-4xl font-black text-white italic tracking-tight">
                {isAdmin ? 'Nexus Master Console' : `Welcome, ${user.username.split(' ')[0]}`}
              </h1>
              <p className="text-emerald-900 font-bold text-[10px] tracking-widest uppercase mt-3 flex items-center gap-3">
                <i className="fas fa-server text-emerald-500"></i>
                AWS Secure Cloud Environment • HIPAA Compliant
              </p>
            </div>
            
            <div className="flex gap-4 relative z-10 shrink-0">
              {isAdmin ? (
                <button 
                  onClick={() => { setEditingDoc(null); setIsProvisioningDoc(true); }}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 group"
                >
                  <i className="fas fa-user-plus mr-3"></i>
                  Register Specialist
                </button>
              ) : (
                <button 
                  onClick={() => { setActiveTab('home'); setTimeout(() => specialistsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
                >
                  <i className="fas fa-calendar-check mr-3 group-hover:rotate-12 transition-transform"></i>
                  New Appointment
                </button>
              )}
            </div>
          </div>

          {activeTab === 'home' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              {isAdmin && (
                <section>
                  <h2 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.4em] mb-8 ml-6 italic">Global Appointment Ledger</h2>
                  <div className="bg-emerald-950/20 rounded-[3rem] border border-emerald-500/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-emerald-500/5">
                        <tr>
                          <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Patient Details</th>
                          <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Medical Provider</th>
                          <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Scheduled Time</th>
                          <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Status</th>
                          <th className="p-8 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map(app => (
                          <tr key={app.id} className="border-t border-emerald-500/5 hover:bg-emerald-500/5 transition-colors">
                            <td className="p-8">
                              <p className="text-white font-black text-sm">{app.patientName}</p>
                              <p className="text-[9px] text-emerald-900 font-bold uppercase tracking-widest mt-1">{app.patientEmail}</p>
                            </td>
                            <td className="p-8 text-emerald-100 italic font-medium">{app.doctorName}</td>
                            <td className="p-8 text-emerald-800 text-[11px] font-bold">{app.date} • {app.time}</td>
                            <td className="p-8">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                app.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-md' : 
                                app.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-900/40 text-emerald-800'
                              }`}>{app.status}</span>
                            </td>
                            <td className="p-8 text-right flex gap-3 justify-end">
                              {app.status === 'pending' && (
                                <button onClick={() => handleUpdateStatus(app.id, 'confirmed')} className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-emerald-950 transition-all shadow-md"><i className="fas fa-check"></i></button>
                              )}
                              <button onClick={() => handleUpdateStatus(app.id, 'cancelled')} className="w-10 h-10 bg-emerald-950 text-emerald-700 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md"><i className="fas fa-trash-alt"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {!isAdmin && (
                <section>
                  <h2 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.4em] mb-8 ml-6 italic">Current Care Plan</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    {patientAppointments.length === 0 ? (
                      <div className="md:col-span-3 py-24 text-center bg-emerald-950/10 rounded-[3rem] border-2 border-dashed border-emerald-500/5 text-emerald-900 font-black uppercase tracking-widest text-[11px]">No upcoming appointments scheduled</div>
                    ) : (
                      patientAppointments.map(app => (
                        <div key={app.id} className="bg-emerald-950/30 p-8 rounded-[3rem] border border-emerald-500/5 hover:border-emerald-500/20 transition-all shadow-lg group">
                          <div className="flex justify-between items-center mb-6">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              app.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-950 text-emerald-800'
                            }`}>{app.status}</span>
                            <span className="text-[10px] font-bold text-emerald-900 italic tracking-widest">Ref: {app.id.split('-')[1]}</span>
                          </div>
                          <h4 className="text-xl font-black text-white tracking-tighter italic">{app.doctorName}</h4>
                          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-1 mb-8">{app.specialty}</p>
                          <div className="flex items-center gap-3 text-emerald-700 text-[11px] font-bold italic">
                            <i className="far fa-calendar-alt text-emerald-500"></i>
                            {app.date} • {app.time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {!isAdmin && (
                <section ref={specialistsRef} className="scroll-mt-32">
                  <h2 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.4em] mb-8 ml-6 italic">Hospital Specialists Directory</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {doctors.map(doc => (
                      <div key={doc.id} className="bg-emerald-950/20 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-emerald-500/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                        <div className="flex gap-6 items-start mb-10 relative z-10">
                          <div className="relative">
                            <img src={doc.imageUrl} className="w-24 h-24 rounded-[2.5rem] object-cover shadow-2xl border-4 border-emerald-900/40 group-hover:border-emerald-500/40 transition-all" alt={doc.name} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white tracking-tighter italic">{doc.name}</h3>
                            <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">{doc.specialty}</p>
                            <p className="text-emerald-900 text-[10px] font-bold mt-2 uppercase italic">{doc.experience} Experience</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedDoctor(doc); setBookingForm(prev => ({ ...prev, doctorId: doc.id })); setIsBookingModalOpen(true); }} className="w-full py-5 bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-500 group-hover:text-emerald-950 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 shadow-lg">
                          Book Consultant
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'calendar' && <CalendarView user={user} appointments={appointments} />}

          {activeTab === 'records' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <SupportHub user={user} onNotify={onNotify} />
            </div>
          )}

          {activeTab === 'doctors' && isAdmin && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="flex flex-col gap-2 mb-10">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Doctor Registry Management</h2>
                <p className="text-emerald-700 text-[10px] font-black uppercase tracking-[0.4em] italic">Maintain Hospital Medical Staff Directory</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.map(doc => (
                  <div key={doc.id} className="bg-emerald-950/20 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-emerald-500/5 hover:border-emerald-500/20 transition-all group shadow-xl">
                    <div className="flex gap-6 items-start mb-8">
                      <img src={doc.imageUrl} className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-emerald-500/20 shadow-2xl transition-all group-hover:border-emerald-500" alt={doc.name} />
                      <div>
                        <h3 className="text-lg font-black text-white italic tracking-tighter">{doc.name}</h3>
                        <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">{doc.specialty}</p>
                        <p className="text-[9px] text-emerald-900 font-bold mt-1 uppercase tracking-widest">ID: {doc.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setEditingDoc(doc);
                          setDocForm({
                            name: doc.name,
                            specialty: doc.specialty,
                            experience: doc.experience,
                            bio: doc.bio,
                            imageUrl: doc.imageUrl
                          });
                          setIsProvisioningDoc(true);
                        }}
                        className="flex-1 py-4 bg-emerald-900/40 text-emerald-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-emerald-950 transition-all border border-emerald-500/10 shadow-lg"
                      >
                        Update Metadata
                      </button>
                      <button onClick={() => handleDeleteDoctor(doc.id)} className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center justify-center border border-red-500/10">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'patients' && isAdmin && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="flex flex-col gap-2 mb-10">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Patient Identity Management</h2>
                <p className="text-emerald-700 text-[10px] font-black uppercase tracking-[0.4em] italic">Manage Global User Identities and Role Permissions</p>
              </div>
              <div className="bg-emerald-950/20 rounded-[3rem] border border-emerald-500/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-emerald-500/5">
                    <tr>
                      <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Registry ID</th>
                      <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Legal Name</th>
                      <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Contact Identity</th>
                      <th className="p-8 text-[10px] font-black text-emerald-800 uppercase tracking-widest">Status</th>
                      <th className="p-8 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id} className="border-t border-emerald-500/5 hover:bg-emerald-500/5 transition-colors">
                        <td className="p-8 text-emerald-500 font-black font-mono text-[10px] tracking-widest">{u.id}</td>
                        <td className="p-8 text-white font-black">{u.username}</td>
                        <td className="p-8 text-emerald-800 text-[11px] font-bold">{u.email}</td>
                        <td className="p-8">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            u.isVerified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {u.isVerified ? 'Active' : 'Unverified'}
                          </span>
                        </td>
                        <td className="p-8 text-right">
                          <div className="flex justify-end gap-3">
                            <select 
                              className="bg-emerald-950/60 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              disabled={u.id === user.id} 
                            >
                              <option value={UserRole.PATIENT}>Patient</option>
                              <option value={UserRole.DOCTOR}>Doctor</option>
                              <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                            <button className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-emerald-950 transition-all shadow-md">
                              <i className="fas fa-user-gear"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Chatbot Widget FAB */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-6">
        {isChatOpen && (
          <div className="w-[380px] md:w-[450px] shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="relative">
              <button 
                onClick={() => setIsChatOpen(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-emerald-950 rounded-full border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xl hover:bg-red-500 hover:text-white transition-all z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              <SupportHub user={user} onNotify={onNotify} isCompact={true} />
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white text-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-90 hover:rotate-12 ${isChatOpen ? 'bg-emerald-950 text-emerald-500' : 'bg-emerald-500 text-emerald-950'}`}
        >
          <i className={`fas ${isChatOpen ? 'fa-comment-slash' : 'fa-robot'}`}></i>
        </button>
      </div>

      {/* MODAL: DOCTOR REGISTRY (ADMIN ONLY) */}
      {isProvisioningDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-emerald-950 w-full max-w-2xl rounded-[4rem] p-14 border border-emerald-500/10 shadow-2xl relative">
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
              {editingDoc ? 'Modify Registry' : 'Register Specialist'}
            </h3>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em] mb-12">Authorized Personnel Only</p>
            
            <form onSubmit={handleDocSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Full Legal Name</label>
                  <input type="text" required className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} placeholder="Dr. Sarah Mitchell" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Medical Specialty</label>
                  <select className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={docForm.specialty} onChange={e => setDocForm({...docForm, specialty: e.target.value})}>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Experience Metric</label>
                  <input type="text" required className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={docForm.experience} onChange={e => setDocForm({...docForm, experience: e.target.value})} placeholder="e.g. 15 Years" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Profile Image URL</label>
                  <input type="text" className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={docForm.imageUrl} onChange={e => setDocForm({...docForm, imageUrl: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Professional Bio</label>
                <textarea className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none h-32 no-scrollbar transition-all" value={docForm.bio} onChange={e => setDocForm({...docForm, bio: e.target.value})} placeholder="Background, clinical focus..." />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setIsProvisioningDoc(false); setEditingDoc(null); }} className="flex-1 py-5 bg-emerald-950 text-emerald-800 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-emerald-500/10">Cancel</button>
                <button type="submit" className="flex-[2] py-5 bg-emerald-500 text-emerald-950 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">
                  {editingDoc ? 'Commit Session Changes' : 'Link Registry Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOKING (UNIFIED) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-emerald-950 w-full max-w-xl rounded-[4rem] p-14 border border-emerald-500/10 shadow-2xl relative">
            <button onClick={() => setIsBookingModalOpen(false)} className="absolute top-10 right-10 text-emerald-900 hover:text-emerald-500 text-2xl transition-colors">
              <i className="fas fa-times-circle"></i>
            </button>
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Schedule Appointment</h3>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em] mb-12">Select your preferred care session</p>
            
            <form onSubmit={handleCommitBooking} className="space-y-6">
              {isAdmin && (
                <div className="space-y-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Patient Full Name</label>
                    <input type="text" required className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={bookingForm.patientName} onChange={e => setBookingForm({...bookingForm, patientName: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Patient Email Address</label>
                    <input type="email" required className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={bookingForm.patientEmail} onChange={e => setBookingForm({...bookingForm, patientEmail: e.target.value})} />
                   </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Appointment Date</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]} className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Available Time</label>
                  <select required className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none disabled:opacity-30 transition-all" value={bookingForm.time} disabled={!bookingForm.date || isLoadingSlots} onChange={e => setBookingForm({...bookingForm, time: e.target.value})}>
                    <option value="">{isLoadingSlots ? 'Fetching Slots...' : 'Select a Slot'}</option>
                    {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-4">Contact Phone Number</label>
                <input type="tel" required className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 outline-none transition-all" placeholder="+1 (555) 000-0000" value={bookingForm.contact} onChange={e => setBookingForm({...bookingForm, contact: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-10">
                <button type="button" onClick={() => setIsBookingModalOpen(false)} className="flex-1 py-5 bg-emerald-950 text-emerald-800 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-emerald-500/10">Cancel</button>
                <button type="submit" disabled={!bookingForm.time} className="flex-[2] py-5 bg-emerald-500 text-emerald-950 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl disabled:opacity-30 active:scale-95 transition-all">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
