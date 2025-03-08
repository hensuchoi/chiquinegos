import { Timestamp } from 'firebase/firestore';

export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  location: {
    isNational: boolean;
    province: string;
    city: string;
  };
  contactInfo: {
    instagram?: string;
    email: string;
    whatsapp: string;
  };
  images: string[];
  reviews: Review[];
  rating: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface FirestoreBusiness extends Omit<Business, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  tags: string[];
  createdAt: Date;
  ownerResponse?: {
    text: string;
    createdAt: Date;
  };
  flags?: {
    count: number;
    reasons: string[];
  };
}

export interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  location: {
    isNational: boolean;
    province: string;
    city: string;
  };
  contactInfo: {
    instagram?: string;
    email: string;
    whatsapp: string;
  };
  images: File[];
}

export interface BusinessUpdateData extends Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'userId'> {
  images: string[];
} 