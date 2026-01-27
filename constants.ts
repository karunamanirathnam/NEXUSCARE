
import { Doctor } from './types';

export const SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "Dermatology",
  "Internal Medicine",
  "Psychiatry"
];

export const mockDoctors: Doctor[] = [
  {
    id: 'DOC-01',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiology',
    experience: '14 Years',
    bio: 'Board-certified cardiologist specializing in interventional cardiology and cardiovascular disease prevention. Fellow of the American College of Cardiology.',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=300&h=300',
    availability: ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM']
  },
  {
    id: 'DOC-02',
    name: 'Dr. James Wilson',
    specialty: 'Neurology',
    experience: '18 Years',
    bio: 'Senior Neurologist with extensive research in neurodegenerative diseases. Expert in treating complex epilepsy and movement disorders.',
    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300',
    availability: ['11:00 AM', '01:00 PM', '03:30 PM', '05:00 PM']
  },
  {
    id: 'DOC-03',
    name: 'Dr. Elena Rodriguez',
    specialty: 'Pediatrics',
    experience: '10 Years',
    bio: 'Dedicated pediatrician focused on adolescent medicine and developmental health. Committed to family-centered care models.',
    imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300',
    availability: ['08:30 AM', '12:00 PM', '02:30 PM', '04:00 PM']
  },
  {
    id: 'DOC-04',
    name: 'Dr. Michael Chen',
    specialty: 'Orthopedics',
    experience: '16 Years',
    bio: 'Specialist in sports medicine and reconstructive joint surgery. Former lead surgeon for national athletic associations.',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300',
    availability: ['10:00 AM', '01:30 PM', '03:00 PM']
  }
];
