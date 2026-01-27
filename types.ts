
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email: string;
  isVerified?: boolean;
  specialty?: string;
  securityQuestion?: string;
}

export interface UserRecord extends User {
  password: string;
  securityAnswer?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  bio: string;
  availability: string[]; 
  imageUrl: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientContact: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'alert' | 'info';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
}

export type MediaType = 'image' | 'audio' | 'video';

export interface MediaAnalysis {
  labels: string[];
  transcript?: string;
  sentiment?: string;
  summary: string;
  keywords?: string[];
  moderationFlags?: string[];
}

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  analysis?: MediaAnalysis;
  chatHistory?: ChatMessage[];
  timestamp: string;
}
