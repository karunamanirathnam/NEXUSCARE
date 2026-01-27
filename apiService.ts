
import { User, UserRole, Doctor, Appointment, AppointmentStatus } from '../types';
import { mockDoctors } from '../constants';

const API_BASE = 'http://localhost:5000/api';

// Fallback Mock Database Logic
const getMockUsers = () => JSON.parse(localStorage.getItem('nexus_mock_users') || '[]');
const saveMockUsers = (users: any[]) => localStorage.setItem('nexus_mock_users', JSON.stringify(users));
const getMockAppointments = () => JSON.parse(localStorage.getItem('nexus_mock_appointments') || '[]');
const saveMockAppointments = (apps: any[]) => localStorage.setItem('nexus_mock_appointments', JSON.stringify(apps));

export const api = {
  async checkStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      return res.ok;
    } catch {
      return true; // Return true to allow UI to proceed in "Simulated Mode"
    }
  },

  async signup(data: any) {
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      // Mock Fallback
      const users = getMockUsers();
      if (users.find((u: any) => u.email === data.email)) {
        return { success: false, message: "Identity clash: Email already registered." };
      }
      const newUser = { 
        id: `USR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, 
        username: data.name, 
        email: data.email, 
        password: data.password, 
        role: UserRole.PATIENT,
        isVerified: false, 
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer
      };
      users.push(newUser);
      saveMockUsers(users);
      return { success: true, user: newUser };
    }
  },

  async login(data: any) {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      // Mock Fallback
      const users = getMockUsers();
      const user = users.find((u: any) => u.email === data.email && u.password === data.password);
      if (user) {
        return { success: true, user };
      }
      // Default dev login
      if (data.email === 'admin@nexus.io' && data.password === 'password') {
        return { success: true, user: { id: 'USR-ADMIN', username: 'System Admin', email: 'admin@nexus.io', role: UserRole.ADMIN, isVerified: true } };
      }
      return { success: false, message: "Invalid credentials. Identity unverified." };
    }
  },

  async verifyUser(userId: string) {
    try {
      const users = getMockUsers();
      const userIndex = users.findIndex((u: any) => u.id === userId);
      if (userIndex > -1) {
        users[userIndex].isVerified = true;
        saveMockUsers(users);
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  async getPatients(): Promise<User[]> {
    try {
      // Logic to fetch all users with PATIENT role
      const users = getMockUsers();
      return users.filter((u: any) => u.role === UserRole.PATIENT);
    } catch {
      return [];
    }
  },

  async verifyIdentity(email: string) {
    try {
      const res = await fetch(`${API_BASE}/verify-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch {
      const users = getMockUsers();
      const user = users.find((u: any) => u.email === email);
      if (user) return { success: true, question: user.securityQuestion };
      return { success: false, message: "Identity not found in AWS registry." };
    }
  },

  async sendResetEmail(email: string, answer: string) {
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer })
      });
      return await res.json();
    } catch {
      const users = getMockUsers();
      const user = users.find((u: any) => u.email === email && u.securityAnswer === answer);
      if (user) return { success: true, message: "Recovery payload dispatched via SMTP Emulator." };
      return { success: false, message: "Security challenge failed." };
    }
  },

  async getDoctors(): Promise<Doctor[]> {
    try {
      const res = await fetch(`${API_BASE}/doctors`);
      return await res.json();
    } catch {
      const localDocs = JSON.parse(localStorage.getItem('nexus_docs') || JSON.stringify(mockDoctors));
      return localDocs;
    }
  },

  async getDoctorAvailability(doctorId: string, date: string): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE}/doctors/${doctorId}/availability?date=${date}`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      const docs = await this.getDoctors();
      const doc = docs.find(d => d.id === doctorId);
      return doc ? doc.availability : [];
    }
  },

  async addDoctor(data: Partial<Doctor>): Promise<Doctor> {
    try {
      const res = await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    } catch {
      const docs = await this.getDoctors();
      const newDoc = { 
        ...data, 
        id: `DOC-${Math.random().toString(36).substr(2, 6).toUpperCase()}` 
      } as Doctor;
      docs.push(newDoc);
      localStorage.setItem('nexus_docs', JSON.stringify(docs));
      return newDoc;
    }
  },

  async updateDoctor(id: string, data: Partial<Doctor>): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    } catch {
      const docs = await this.getDoctors();
      const index = docs.findIndex(d => d.id === id);
      if (index > -1) {
        docs[index] = { ...docs[index], ...data };
        localStorage.setItem('nexus_docs', JSON.stringify(docs));
      }
      return { success: true };
    }
  },

  async deleteDoctor(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'DELETE'
      });
      return res.json();
    } catch {
      const docs = await this.getDoctors();
      const filtered = docs.filter(d => d.id !== id);
      localStorage.setItem('nexus_docs', JSON.stringify(filtered));
      return { success: true };
    }
  },

  async getAppointments(): Promise<Appointment[]> {
    try {
      const res = await fetch(`${API_BASE}/appointments`);
      return await res.json();
    } catch {
      return getMockAppointments();
    }
  },

  async bookAppointment(data: any): Promise<{success: boolean, message?: string, id?: string}> {
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      const apps = getMockAppointments();
      const newId = `APP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const newApp = { ...data, id: newId, status: 'pending', timestamp: new Date().toISOString() };
      apps.push(newApp);
      saveMockAppointments(apps);
      return { success: true, id: newId };
    }
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch {
      const apps = getMockAppointments();
      const app = apps.find((a: any) => a.id === id);
      if (app) app.status = status;
      saveMockAppointments(apps);
      return app;
    }
  }
};
