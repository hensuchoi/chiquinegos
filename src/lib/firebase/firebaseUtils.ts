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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Business, BusinessFormData } from '../types/business';
import { uploadBusinessImage } from './storageUtils';

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
    const data = docSnap.data();
    // Ensure reviews array exists and tags are properly formatted
    const reviews = (data.reviews || []).map((review: any) => ({
      ...review,
      tags: Array.isArray(review.tags) ? review.tags : [],
      createdAt: review.createdAt?.toDate() || new Date(),
    }));

    return {
      id: docSnap.id,
      ...data,
      reviews,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Business;
  }

  return null;
}

// Create new business
export async function createBusiness(
  data: BusinessFormData,
  userId: string,
  onProgress?: (progress: number) => void
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
      nameLower: data.name.toLowerCase(),
      description: data.description,
      descriptionLower: data.description.toLowerCase(),
      category: data.category,
      location: locationData,
      contactInfo: data.contactInfo,
      images: [], // Start with empty images array
      ownerId: userId,
      rating: 0,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'businesses'), businessData);

    // Upload images using the business ID
    const imageUrls = await Promise.all(
      data.images.map(async (image, index) => {
        const url = await uploadBusinessImage(
          image,
          docRef.id,
          ({ progress }) => {
            // Calculate overall progress considering all images
            const overallProgress = 
              (index * 100 + progress) / data.images.length;
            onProgress?.(overallProgress);
          }
        );
        return url;
      })
    );

    // Update the business document with image URLs
    await updateDoc(docRef, {
      images: imageUrls,
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
}

// Update business
export async function updateBusiness(
  id: string,
  data: Partial<BusinessFormData>,
  newImages?: File[]
): Promise<void> {
  const businessRef = doc(db, 'businesses', id);
  const updateData: any = { 
    ...data,
    updatedAt: new Date()
  };

  // Add lowercase fields if name or description are being updated
  if (data.name) {
    updateData.nameLower = data.name.toLowerCase();
  }
  if (data.description) {
    updateData.descriptionLower = data.description.toLowerCase();
  }

  if (newImages?.length) {
    const imageUrls = await Promise.all(
      newImages.map(async (image) => {
        const storageRef = ref(storage, `businesses/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        return getDownloadURL(snapshot.ref);
      })
    );

    // Get current business data to append new images
    const currentBusiness = await getBusinessById(id);
    if (currentBusiness) {
      updateData.images = [...currentBusiness.images, ...imageUrls];
    }
  }

  await updateDoc(businessRef, updateData);
}

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
  if (business.ownerId === userId) {
    throw new Error('No puedes calificar tu propio negocio');
  }

  // Prevent duplicate reviews from the same user
  if (business.reviews?.some(review => review.userId === userId)) {
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

  const review = {
    id: crypto.randomUUID(),
    userId,
    rating,
    tags: validTags,
    createdAt: new Date(),
  };

  const updatedReviews = [...(business.reviews || []), review];
  const averageRating = updatedReviews.reduce((acc, rev) => acc + rev.rating, 0) / updatedReviews.length;

  await updateDoc(doc(db, 'businesses', businessId), {
    reviews: updatedReviews,
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    updatedAt: new Date()
  });
}

export async function respondToReview(businessId: string, reviewId: string, responseText: string) {
  const businessRef = doc(db, 'businesses', businessId);
  const businessDoc = await getDoc(businessRef);

  if (!businessDoc.exists()) {
    throw new Error('Business not found');
  }

  const business = businessDoc.data() as Business;
  const reviewIndex = business.reviews.findIndex(r => r.id === reviewId);

  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }

  const updatedReviews = [...business.reviews];
  updatedReviews[reviewIndex] = {
    ...updatedReviews[reviewIndex],
    ownerResponse: {
      text: responseText,
      createdAt: new Date()
    }
  };

  await updateDoc(businessRef, {
    reviews: updatedReviews
  });
}

export async function flagReview(businessId: string, reviewId: string, reason: string) {
  const businessRef = doc(db, 'businesses', businessId);
  const businessDoc = await getDoc(businessRef);

  if (!businessDoc.exists()) {
    throw new Error('Business not found');
  }

  const business = businessDoc.data() as Business;
  const reviewIndex = business.reviews.findIndex(r => r.id === reviewId);

  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }

  const updatedReviews = [...business.reviews];
  const currentFlags = updatedReviews[reviewIndex].flags || { count: 0, reasons: [] };

  updatedReviews[reviewIndex] = {
    ...updatedReviews[reviewIndex],
    flags: {
      count: currentFlags.count + 1,
      reasons: [...currentFlags.reasons, reason]
    }
  };

  await updateDoc(businessRef, {
    reviews: updatedReviews
  });
}

export async function deleteReview(businessId: string, reviewId: string) {
  const businessRef = doc(db, 'businesses', businessId);
  const businessDoc = await getDoc(businessRef);

  if (!businessDoc.exists()) {
    throw new Error('Business not found');
  }

  const business = businessDoc.data() as Business;
  const updatedReviews = business.reviews.filter(r => r.id !== reviewId);

  // Recalculate average rating
  const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
  const newRating = updatedReviews.length > 0 ? totalRating / updatedReviews.length : 0;

  await updateDoc(businessRef, {
    reviews: updatedReviews,
    rating: newRating
  });
}
