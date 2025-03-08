import DOMPurify from 'isomorphic-dompurify';

export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text.trim());
};

export const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is now optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateWhatsApp = (number: string): boolean => {
  // Ecuador phone number format: +593 XX XXX XXXX or 0XX XXX XXXX
  const ecuadorRegex = /^(?:\+593|0)([2-7]|9[2-9])\d{7}$/;
  return ecuadorRegex.test(number.replace(/\s+/g, '')); // Remove spaces before testing
};

export const validateInstagram = (handle: string): boolean => {
  const instagramRegex = /^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
  return instagramRegex.test(handle);
};

export const validateBusinessData = (data: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres';
  }

  // Validate description
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres';
  }

  // Validate location
  if (!data.location) {
    errors.location = 'La ubicación es requerida';
  } else if (!data.location.isNational) {
    if (!data.location.province) {
      errors.province = 'La provincia es requerida';
    }
    if (!data.location.city) {
      errors.city = 'La ciudad es requerida';
    }
  }

  // Validate contact info
  if (!data.contactInfo) {
    errors.contactInfo = 'La información de contacto es requerida';
  } else {
    // Email is optional now
    if (data.contactInfo.email && !validateEmail(data.contactInfo.email)) {
      errors.email = 'El email no es válido';
    }
    // WhatsApp is required
    if (!data.contactInfo.whatsapp) {
      errors.whatsapp = 'El número de WhatsApp es requerido';
    } else if (!validateWhatsApp(data.contactInfo.whatsapp)) {
      errors.whatsapp = 'El número de WhatsApp no es válido. Debe ser un número de Ecuador (+593 o empezar con 0)';
    }
    if (data.contactInfo.instagram && !validateInstagram(data.contactInfo.instagram)) {
      errors.instagram = 'El usuario de Instagram no es válido';
    }
  }

  // Validate images
  if (!data.images || data.images.length === 0) {
    errors.images = 'Se requiere al menos una imagen';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateReviewData = (data: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = 'La calificación debe estar entre 1 y 5';
  }

  if (!data.comment || data.comment.trim().length === 0) {
    errors.comment = 'El comentario es requerido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 