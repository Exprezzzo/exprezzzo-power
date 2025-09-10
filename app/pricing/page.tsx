'use client';

import { Check } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Monthly',
    price: '$49',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '1,000 API calls per month',
      'Access to all AI models',
      'Roundtable comparisons',
      'Email support',
      'Basic analytics',
    ],
    priceId: 'price_monthly_49',
    popular: false,
  },
  {
    name: 'Yearly',
    price: '$399',
    period: '/year',
    description: 'Best value - 32% off monthly',
    features: [
      '15,000 API calls per year',
      'Access to all AI models',
      'Roundtable comparisons',
      'Priority support',
      'Advanced analytics',
      'Early access to new features',
    ],
    priceId: 'price_yearly_399',
    popular: true,
  },
];

export default function PricingPage() {
  const handleSubscribe = async (priceId: string) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gold-gradient-text mb-4">
            Choose Your Power Level
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Access the world's most powerful AI models at 40% less cost. 
            No lock-ins, just pure performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 backdrop-blur-sm border ${
                plan.popular
                  ? 'border-vegas-gold surface power-tier-card'
                  : 'border-gold/20 surface'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-vegas-gold text-bg-dark px-4 py-1 rounded-full text-sm font-semibold">
                    Best Value
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold gold-gradient-text">
                    {plan.price}
                  </span>
                  <span className="text-muted">{plan.period}</span>
                </div>
                <p className="text-muted mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check size={16} className="text-vegas-gold flex-shrink-0" />
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId)}
                className={
                  plan.popular
                    ? 'w-full btn-vegas-gold'
                    : 'w-full btn-gold'
                }
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted mb-4">
            All plans include unlimited model switching and fair usage policy
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 7-day free trial</span>
            <span>✓ 99.9% uptime SLA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
