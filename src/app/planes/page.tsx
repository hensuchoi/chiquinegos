'use client';

import { useState } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { SUBSCRIPTION_FEATURES, PAYMENT_METHODS, SUBSCRIPTION_PERIODS } from '@/lib/types/user';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function PlansPage() {
  const { user } = useAuth();
  const { subscriptionType, loading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'business'>(subscriptionType);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<keyof typeof PAYMENT_METHODS>('mobileWallet');
  const router = useRouter();

  const plans = [
    {
      name: 'Free',
      type: 'free',
      price: SUBSCRIPTION_PERIODS[selectedPeriod].free,
      description: 'Para empezar a promocionar tu negocio',
      features: SUBSCRIPTION_FEATURES.free,
      cta: 'Comenzar Gratis',
      highlight: false
    },
    {
      name: 'Premium',
      type: 'premium',
      price: SUBSCRIPTION_PERIODS[selectedPeriod].premium,
      description: 'Para negocios en crecimiento',
      features: SUBSCRIPTION_FEATURES.premium,
      cta: 'Actualizar a Premium',
      highlight: true
    },
    {
      name: 'Business',
      type: 'business',
      price: SUBSCRIPTION_PERIODS[selectedPeriod].business,
      description: 'Para negocios establecidos',
      features: SUBSCRIPTION_FEATURES.business,
      cta: 'Actualizar a Business',
      highlight: false
    }
  ];

  const periodLabels = {
    monthly: 'Mensual',
    quarterly: 'Trimestral (20% descuento)',
    annual: 'Anual (33% descuento)'
  };

  const handleUpgrade = (planType: 'free' | 'premium' | 'business') => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Here you would integrate with your payment processor
    const planDetails = {
      type: planType,
      period: selectedPeriod,
      paymentMethod: selectedPaymentMethod,
      price: SUBSCRIPTION_PERIODS[selectedPeriod][planType]
    };
    
    console.log('Plan details:', planDetails);
    alert('Procesando tu solicitud. Te contactaremos para completar el pago.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Planes y Precios
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* Period Selection */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm">
          {Object.entries(periodLabels).map(([period, label]) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period as 'monthly' | 'quarterly' | 'annual')}
              className={`px-4 py-2 text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${
                period === 'monthly'
                  ? 'rounded-l-md'
                  : period === 'annual'
                  ? 'rounded-r-md'
                  : ''
              } border border-gray-300`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mt-8">
        <h3 className="text-center text-lg font-medium text-gray-900 mb-4">
          Método de Pago
        </h3>
        <div className="flex justify-center space-x-4">
          {Object.entries(PAYMENT_METHODS).map(([method, label]) => (
            <button
              key={method}
              onClick={() => setSelectedPaymentMethod(method as keyof typeof PAYMENT_METHODS)}
              className={`px-4 py-2 rounded-md ${
                selectedPaymentMethod === method
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } border`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.type}
            className={`rounded-lg shadow-lg overflow-hidden transform transition-all duration-200 ${
              plan.highlight ? 'scale-105 border-2 border-blue-500' : ''
            }`}
          >
            <div className="px-6 py-8 bg-white">
              <h3 className="text-2xl font-bold text-gray-900 text-center">
                {plan.name}
              </h3>
              <p className="mt-4 text-gray-600 text-center">
                {plan.description}
              </p>
              <p className="mt-8 text-center">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/{selectedPeriod.slice(0, -2)}</span>
              </p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.type as 'free' | 'premium' | 'business')}
                className={`mt-8 block w-full px-6 py-3 text-center font-medium rounded-md ${
                  plan.type === subscriptionType
                    ? 'bg-gray-100 text-gray-800 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={plan.type === subscriptionType}
              >
                {plan.type === subscriptionType ? 'Plan Actual' : plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-16 max-w-3xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información Importante
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Aceptamos múltiples métodos de pago para tu comodidad</li>
            <li>• Planes flexibles con descuentos por períodos más largos</li>
            <li>• Cancela en cualquier momento sin compromiso</li>
            <li>• Soporte local disponible para ayudarte</li>
            <li>• Facturación en moneda local disponible</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 