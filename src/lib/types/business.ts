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
  createdAt: Date;
  updatedAt: Date;
  userId: string;
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