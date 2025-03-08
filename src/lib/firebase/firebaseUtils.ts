import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Business, BusinessFormData, BusinessUpdateData, Review, FirestoreBusiness } from '../types/business';
import { uploadBusinessImage } from './storageUtils';
import { Timestamp } from "firebase/firestore";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Search businesses
export async function searchBusinesses(
  searchTerm?: string,
  lastDoc?: any,
  pageSize: number = 12,
  filters?: {
    category?: string;
    province?: string;
    city?: string;
  }
): Promise<{ businesses: Business[]; lastDoc: any }> {
  try {
    const businessesRef = collection(db, 'businesses');
    let q;

    if (searchTerm && searchTerm.trim()) {
      // Get all businesses and filter in memory
      q = query(
        businessesRef,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const searchTermLower = searchTerm.toLowerCase().trim();
      
      // Filter businesses that match the search term in name or description
      const matchingBusinesses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Business))
        .filter(business => {
          // Search term filter
          const nameMatch = business.name.toLowerCase().includes(searchTermLower);
          const descriptionMatch = business.description.toLowerCase().includes(searchTermLower);
          const matchesSearch = nameMatch || descriptionMatch;

          // Category filter
          const matchesCategory = !filters?.category || business.category === filters.category;

          // Location filter
          const matchesLocation = !filters?.province || (
            (!business.location.isNational && business.location.province === filters.province) ||
            business.location.isNational
          );
          const matchesCity = !filters?.city || (
            !business.location.isNational && business.location.city === filters.city
          );

          return matchesSearch && matchesCategory && matchesLocation && matchesCity;
        })
        .slice(0, pageSize);

      return {
        businesses: matchingBusinesses,
        lastDoc: matchingBusinesses.length > 0 ? matchingBusinesses[matchingBusinesses.length - 1].createdAt : null
      };
    } else {
      // If no search term, get all businesses ordered by creation date
      q = query(
        businessesRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize),
        ...(lastDoc ? [startAfter(lastDoc)] : [])
      );

      const snapshot = await getDocs(q);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      let businesses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Business[];

      // Apply filters if any
      if (filters) {
        businesses = businesses.filter(business => {
          // Category filter
          const matchesCategory = !filters.category || business.category === filters.category;

          // Location filter
          const matchesLocation = !filters.province || (
            (!business.location.isNational && business.location.province === filters.province) ||
            business.location.isNational
          );
          const matchesCity = !filters.city || (
            !business.location.isNational && business.location.city === filters.city
          );

          return matchesCategory && matchesLocation && matchesCity;
        });
      }

      return {
        businesses,
        lastDoc: lastVisible
      };
    }
  } catch (error) {
    console.error('Error searching businesses:', error);
    throw error;
  }
}

// Get business by ID
export async function getBusinessById(id: string): Promise<Business | null> {
  const docRef = doc(db, 'businesses', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as FirestoreBusiness;
    
    // Convert Firestore timestamps to Dates and ensure proper typing
    return {
      id: docSnap.id,
      ...data,
      reviews: (data.reviews || []).map((review: any) => ({
        ...review,
        tags: Array.isArray(review.tags) ? review.tags : [],
        createdAt: review.createdAt instanceof Timestamp ? review.createdAt.toDate() : (review.createdAt || new Date()),
        ownerResponse: review.ownerResponse ? {
          ...review.ownerResponse,
          createdAt: review.ownerResponse.createdAt instanceof Timestamp 
            ? review.ownerResponse.createdAt.toDate() 
            : (review.ownerResponse.createdAt || new Date())
        } : undefined
      })),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt || new Date())
    };
  }

  return null;
}

interface ProgressCallback {
  progress: number;
}

// Create new business
export async function createBusiness(
  data: BusinessFormData,
  userId: string,
  onProgress?: (progress: ProgressCallback) => void
): Promise<string> {
  try {
    // Format location data
    const locationData = data.location.isNational
      ? { isNational: true }
      : {
          isNational: false,
          province: data.location.province,
          city: data.location.city,
        };

    // Create business document first to get the ID
    const businessData = {
      name: data.name,
      description: data.description,
      category: data.category,
      location: locationData,
      contactInfo: data.contactInfo,
      images: [], // Start with empty images array
      userId: userId,
      reviews: [],
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'businesses'), businessData);

    // Upload images using the business ID
    const imageUrls = await Promise.all(
      data.images.map(async (image, index) => {
        const url = await uploadBusinessImage(
          image,
          docRef.id,
          (progress: ProgressCallback) => {
            // Calculate overall progress considering all images
            const overallProgress = 
              (index * 100 + progress.progress) / data.images.length;
            onProgress?.({ progress: overallProgress });
          }
        );
        return url;
      })
    );

    // Update the business document with image URLs
    await updateDoc(docRef, {
      images: imageUrls,
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
}

// Update business
export const updateBusiness = async (
  businessId: string,
  updates: Partial<BusinessUpdateData>
): Promise<void> => {
  const businessRef = doc(db, 'businesses', businessId);
  await updateDoc(businessRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Delete business
export async function deleteBusiness(id: string): Promise<void> {
  const business = await getBusinessById(id);
  if (!business) return;

  // Delete images from storage
  await Promise.all(
    business.images.map(async (imageUrl) => {
      const imageRef = ref(storage, imageUrl);
      try {
        await deleteObject(imageRef);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    })
  );

  // Delete business document
  await deleteDoc(doc(db, 'businesses', id));
}

// Add review
export async function addReview(
  businessId: string,
  userId: string,
  rating: number,
  tags: string[]
): Promise<void> {
  const business = await getBusinessById(businessId);
  if (!business) throw new Error('Business not found');
  
  // Prevent owners from reviewing their own business
  if (business.userId === userId) {
    throw new Error('No puedes calificar tu propio negocio');
  }

  // Prevent duplicate reviews from the same user
  if (business.reviews.some(review => review.userId === userId)) {
    throw new Error('Ya has calificado este negocio');
  }

  // Validate and clean tags
  const validTags = (tags || [])
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  if (validTags.length === 0) {
    throw new Error('Debes seleccionar al menos un aspecto para calificar');
  }

  const review: Review = {
    id: crypto.randomUUID(),
    userId,
    rating,
    tags: validTags,
    createdAt: new Date()
  };

  const updatedReviews = [...business.reviews, review];
  const averageRating = updatedReviews.reduce((acc, rev) => acc + rev.rating, 0) / updatedReviews.length;

  await updateDoc(doc(db, 'businesses', businessId), {
    reviews: updatedReviews,
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    updatedAt: serverTimestamp()
  });
}

export async function respondToReview(businessId: string, reviewId: string, responseText: string): Promise<void> {
  const business = await getBusinessById(businessId);
  if (!business) throw new Error('Business not found');

  const reviewIndex = business.reviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) throw new Error('Review not found');

  const updatedReviews = [...business.reviews];
  updatedReviews[reviewIndex] = {
    ...updatedReviews[reviewIndex],
    ownerResponse: {
      text: responseText,
      createdAt: new Date()
    }
  };

  await updateDoc(doc(db, 'businesses', businessId), {
    reviews: updatedReviews,
    updatedAt: serverTimestamp()
  });
}

export async function flagReview(businessId: string, reviewId: string, reason: string): Promise<void> {
  const business = await getBusinessById(businessId);
  if (!business) throw new Error('Business not found');

  const reviewIndex = business.reviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) throw new Error('Review not found');

  const updatedReviews = [...business.reviews];
  const currentFlags = updatedReviews[reviewIndex].flags || { count: 0, reasons: [] };

  updatedReviews[reviewIndex] = {
    ...updatedReviews[reviewIndex],
    flags: {
      count: currentFlags.count + 1,
      reasons: [...currentFlags.reasons, reason]
    }
  };

  await updateDoc(doc(db, 'businesses', businessId), {
    reviews: updatedReviews,
    updatedAt: serverTimestamp()
  });
}

export async function deleteReview(businessId: string, reviewId: string): Promise<void> {
  const business = await getBusinessById(businessId);
  if (!business) throw new Error('Business not found');

  const updatedReviews = business.reviews.filter(r => r.id !== reviewId);

  // Recalculate average rating
  const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
  const newRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 0;

  await updateDoc(doc(db, 'businesses', businessId), {
    reviews: updatedReviews,
    rating: Math.round(newRating * 10) / 10,
    updatedAt: serverTimestamp()
  });
}
