import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { UserProfile, SUBSCRIPTION_FEATURES } from '@/lib/types/user';

export function useSubscription() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as Omit<UserProfile, 'id'>;
          setUserProfile({
            id: userDoc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt || new Date()),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
            subscription: {
              ...data.subscription,
              startDate: data.subscription?.startDate instanceof Timestamp 
                ? data.subscription.startDate.toDate() 
                : (data.subscription?.startDate || new Date()),
              endDate: data.subscription?.endDate instanceof Timestamp 
                ? data.subscription.endDate.toDate() 
                : (data.subscription?.endDate || new Date())
            }
          });
        } else {
          // Create a free subscription for new users
          const newProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            subscription: {
              type: 'free',
              isActive: true,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
              features: SUBSCRIPTION_FEATURES.free
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setUserProfile(newProfile);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Error loading subscription information');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [user]);

  const hasFeature = (featureName: string): boolean => {
    if (!userProfile?.subscription?.isActive) return false;
    return userProfile.subscription.features.includes(featureName);
  };

  const canCreateBusiness = (): boolean => {
    if (!userProfile?.subscription?.isActive) return false;
    
    switch (userProfile.subscription.type) {
      case 'free':
        return true; // Free users can create 1 business
      case 'premium':
        return true; // Premium users can create up to 3 businesses
      case 'business':
        return true; // Business users can create unlimited businesses
      default:
        return false;
    }
  };

  const getMaxBusinesses = (): number => {
    if (!userProfile?.subscription?.isActive) return 0;
    
    switch (userProfile.subscription.type) {
      case 'free':
        return 1;
      case 'premium':
        return 3;
      case 'business':
        return Infinity;
      default:
        return 0;
    }
  };

  return {
    userProfile,
    loading,
    error,
    hasFeature,
    canCreateBusiness,
    getMaxBusinesses,
    isSubscribed: userProfile?.subscription?.isActive || false,
    subscriptionType: userProfile?.subscription?.type || 'free'
  };
} 