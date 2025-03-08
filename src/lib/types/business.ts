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
    email: string;
    instagram?: string;
    whatsapp?: string;
  };
  images: string[];
  rating: number;
  reviews: Review[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
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
    email: string;
    instagram?: string;
    whatsapp?: string;
  };
  images: File[];
} 