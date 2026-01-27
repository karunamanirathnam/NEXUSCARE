
import { User, UserRole, Doctor, Appointment, AppointmentStatus } from '../types';
import { mockDoctors } from '../constants';

const API_BASE = 'http://localhost:5000/api';

// Fallback Mock Database Logic
const getMockUsers = () => JSON.parse(localStorage.getItem('nexus_mock_users') || '[]');
const saveMockUsers = (users: any[]) => localStorage.setItem('nexus_mock_users', JSON.stringify(users));
const getMockAppointments = () => JSON.parse(localStorage.getItem('nexus_mock_appointments') || '[]');
const saveMockAppointments = (apps: any[]) => localStorage.setItem('nexus_mock_appointments', JSON.stringify(apps));

export const api = {
  // Fix: Check status of the backend API
  async checkStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`);
      return res.ok;
    } catch {
      return true;
    }
  },

  // Fix: Sign up a new user with provided data
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
        role: data.role || UserRole.PATIENT, 
        isVerified: true, 
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer
      };
      users.push(newUser);
      saveMockUsers(users);
      return { success: true, user: newUser };
    }
  },

  // Fix: Authenticate user session
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
      // Master Admin for testing
      if (data.email === 'admin@gmail.com' && data.password === 'admin123') {
        return { 
          success: true, 
          user: { 
            id: 'USR-MASTER-ADMIN', 
            username: 'Master Administrator', 
            email: 'admin@gmail.com', 
            role: UserRole.ADMIN, 
            isVerified: true 
          } 
        };
      }
      return { success: false, message: "Invalid credentials. Identity unverified." };
    }
  },

  // Fix: Fetch all registered users
  async getAllUsers(): Promise<User[]> {
    try {
      return getMockUsers();
    } catch {
      return [];
    }
  },

  // Fix: Update user profile information
  async updateUser(userId: string, data: any): Promise<any> {
    const users = getMockUsers();
    const index = users.findIndex((u: any) => u.id === userId);
    if (index > -1) {
      users[index] = { ...users[index], ...data };
      saveMockUsers(users);
      return { success: true, user: users[index] };
    }
    return { success: false, message: "User not found." };
  },

  // Fix: Update user role permissions
  async updateUserRole(userId: string, role: UserRole): Promise<any> {
    const users = getMockUsers();
    const index = users.findIndex((u: any) => u.id === userId);
    if (index > -1) {
      users[index].role = role;
      saveMockUsers(users);
      return { success: true };
    }
    return { success: false };
  },

  // Fix: Retrieve specialist directory
  async getDoctors(): Promise<Doctor[]> {
    try {
      const res = await fetch(`${API_BASE}/doctors`);
      return await res.json();
    } catch {
      const localDocs = JSON.parse(localStorage.getItem('nexus_docs') || JSON.stringify(mockDoctors));
      return localDocs;
    }
  },

  // Fix: Get specific doctor's availability for a given date
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

  // Fix: Register a new specialist
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
      const newDoc = { ...data, id: `DOC-${Math.random().toString(36).substr(2, 6).toUpperCase()}` } as Doctor;
      docs.push(newDoc);
      localStorage.setItem('nexus_docs', JSON.stringify(docs));
      return newDoc;
    }
  },

  // Fix: Update specialist information
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

  // Fix: Remove a specialist from registry
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

  // Fix: Fetch all appointments
  async getAppointments(): Promise<Appointment[]> {
    try {
      const res = await fetch(`${API_BASE}/appointments`);
      return await res.json();
    } catch {
      return getMockAppointments();
    }
  },

  // Fix: Book a new visit session
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

  // Fix: Update the status of an existing appointment
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
