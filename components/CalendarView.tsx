
import React, { useState } from 'react';
import { Appointment, User, UserRole } from '../types';

interface CalendarViewProps {
  user: User;
  appointments: Appointment[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ user, appointments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const filteredAppointments = appointments.filter(app => {
    if (user.role === UserRole.PATIENT) return app.patientId === user.id;
    if (user.role === UserRole.DOCTOR) return app.doctorId === user.id;
    return true; // Admin sees all
  });

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredAppointments.filter(app => app.date === dateStr);
  };

  const days = [];
  const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
  const startOffset = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());

  for (let i = 0; i < startOffset; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border border-white/5 opacity-20"></div>);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayAppointments = getAppointmentsForDay(day);
    const isSelected = selectedDay === day;
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

    days.push(
      <div 
        key={day} 
        onClick={() => setSelectedDay(day)}
        className={`h-24 md:h-32 border border-white/5 p-2 transition-all cursor-pointer relative group overflow-hidden ${
          isSelected ? 'bg-rose-600/10 border-rose-500/50' : 'hover:bg-white/5'
        }`}
      >
        <div className="flex justify-between items-center relative z-10">
          <span className={`text-xs font-black ${isToday ? 'bg-rose-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : isSelected ? 'text-rose-500' : 'text-slate-500'}`}>
            {day}
          </span>
          {dayAppointments.length > 0 && (
            <span className="text-[8px] font-black bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
              {dayAppointments.length} Visit{dayAppointments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="mt-2 space-y-1 relative z-10">
          {dayAppointments.slice(0, 2).map((app, idx) => (
            <div key={idx} className="text-[7px] font-black uppercase tracking-widest text-white truncate bg-white/5 px-1 py-0.5 rounded border border-white/5">
              {app.time} - {user.role === UserRole.PATIENT ? app.doctorName : app.patientName}
            </div>
          ))}
          {dayAppointments.length > 2 && (
            <div className="text-[7px] font-black text-rose-500 uppercase tracking-widest text-center mt-1">
              +{dayAppointments.length - 2} More
            </div>
          )}
        </div>
        {isSelected && <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>}
      </div>
    );
  }

  const selectedAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

  return (
    <div className="grid lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between bg-rose-950/20 p-6 rounded-[2.5rem] border border-rose-500/10">
          <div className="flex items-center gap-4">
            <button onClick={handlePrevMonth} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition">
              <i className="fas fa-chevron-left"></i>
            </button>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter w-48 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={handleNextMonth} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-rose-600"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Scheduled</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Today</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-[3rem] overflow-hidden border-rose-500/10 shadow-2xl">
          <div className="grid grid-cols-7 border-b border-white/10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] bg-white/5">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <div className="glass p-8 rounded-[3rem] border-rose-500/10 min-h-[400px] flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Day Logistics</h3>
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">
              {selectedDay ? `${monthNames[currentDate.getMonth()]} ${selectedDay}, ${currentDate.getFullYear()}` : 'Select a date'}
            </p>
          </div>

          <div className="flex-grow space-y-4">
            {selectedAppointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                <i className="fas fa-calendar-circle-exclamation text-4xl mb-4 text-slate-600"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No Transmissions Found</p>
              </div>
            ) : (
              selectedAppointments.map((app, idx) => (
                <div key={app.id} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-rose-500/20 transition-all group animate-in slide-in-from-right-4 fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                      {app.time}
                    </span>
                    <span className={`text-[7px] font-black uppercase tracking-widest ${app.status === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {app.status}
                    </span>
                  </div>
                  <h4 className="text-white font-black italic text-sm truncate">
                    {user.role === UserRole.PATIENT ? app.doctorName : app.patientName}
                  </h4>
                  <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest mt-1">
                    {app.specialty}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-500/10">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Cluster Metrics</p>
              <div className="flex justify-between items-end">
                <span className="text-white font-black text-2xl italic tracking-tighter">
                  {selectedAppointments.length}
                </span>
                <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest mb-1">Active Sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
