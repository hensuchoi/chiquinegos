export interface UserProfile {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionStatus {
  type: 'free' | 'premium' | 'business';
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  features: string[];
}

export const SUBSCRIPTION_FEATURES = {
  free: [
    'Un negocio gratuito',
    'Listado básico',
    'Fotos básicas (2 fotos)',
    'Contacto por WhatsApp',
    'Reseñas básicas'
  ],
  premium: [
    'Hasta 3 negocios',
    'Listado destacado',
    'Más fotos (hasta 10)',
    'WhatsApp y redes sociales',
    'Reseñas con fotos',
    'Estadísticas básicas',
    'Ofertas especiales',
    'Pagos móviles',
    'Soporte prioritario'
  ],
  business: [
    'Negocios ilimitados',
    'Listado premium con prioridad',
    'Fotos y videos ilimitados',
    'Todos los métodos de contacto',
    'Sistema completo de reseñas',
    'Estadísticas avanzadas',
    'Panel de administración',
    'Publicidad incluida',
    'Marketing por WhatsApp',
    'Pagos móviles y QR',
    'Soporte 24/7',
    'Capacitación empresarial'
  ]
};

export const PAYMENT_METHODS = {
  cash: 'Pago en efectivo',
  mobileWallet: 'Billetera móvil',
  bankTransfer: 'Transferencia bancaria',
  creditCard: 'Tarjeta de crédito'
};

export const SUBSCRIPTION_PERIODS = {
  monthly: {
    free: '0',
    premium: '4.99',
    business: '14.99'
  },
  quarterly: {
    free: '0',
    premium: '12.99',
    business: '39.99'
  },
  annual: {
    free: '0',
    premium: '39.99',
    business: '149.99'
  }
}; 