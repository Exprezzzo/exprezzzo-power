'use client';

import { Check, Zap, Crown, Rocket, Star, TrendingUp, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 9,
    description: 'Perfect for individuals and small projects',
    features: [
      '10,000 API calls/month',
      'GPT-4o & Claude 3.5 access',
      'Basic support',
      '40% cost savings',
      'Standard rate limits'
    ],
    icon: Zap,
    popular: false,
    color: 'from-gray-600 to-gray-700'
  },
  {
    name: 'Professional',
    price: 29,
    description: 'Ideal for growing businesses and teams',
    features: [
      '100,000 API calls/month',
      'All premium models',
      'Priority support',
      '50% cost savings',
      'Higher rate limits',
      'Usage analytics',
      'Team collaboration'
    ],
    icon: Crown,
    popular: true,
    color: 'from-gold to-gold-dark'
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large-scale applications and organizations',
    features: [
      '1M+ API calls/month',
      'All models + early access',
      'Dedicated support',
      '60% cost savings',
      'Custom rate limits',
      'Advanced analytics',
      'Custom integrations',
      'SLA guarantee',
      'White-label options'
    ],
    icon: Rocket,
    popular: false,
    color: 'from-sovereign to-sovereign-dark'
  }
];

const providers = [
  {
    name: 'OpenAI GPT-4',
    directCost: '$30/1M tokens',
    ourCost: '$18/1M tokens',
    savings: '40%'
  },
  {
    name: 'Claude 3.5 Sonnet',
    directCost: '$15/1M tokens',
    ourCost: '$8/1M tokens',
    savings: '47%'
  },
  {
    name: 'Cohere Command R+',
    directCost: '$3/1M tokens',
    ourCost: '$1.5/1M tokens',
    savings: '50%'
  },
  {
    name: 'Kani (Fastest)',
    directCost: '$5/1M tokens',
    ourCost: '$2/1M tokens',
    savings: '60%'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-chocolate-dark via-chocolate-darker to-black text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gold via-gold-dark to-gold bg-clip-text text-transparent">
              Robin Hood
            </span>
            <br />
            AI Pricing
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            We're taking from the AI rich and giving to the developer poor. 
            Same premium models, 40-60% less cost. No compromises, no catches.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Same quality & speed</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              <span>40-60% cost savings</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Real-time routing</span>
            </div>
          </div>
        </div>

        {/* Cost Comparison Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            Direct Cost Comparison
          </h2>
          <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-chocolate-surface/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">AI Model</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Direct API Cost</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">EXPREZZZ Cost</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Your Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => (
                    <tr key={provider.name} className={index % 2 === 0 ? 'bg-chocolate-surface/10' : ''}>
                      <td className="px-6 py-4 font-medium">{provider.name}</td>
                      <td className="px-6 py-4 text-center text-red-300">{provider.directCost}</td>
                      <td className="px-6 py-4 text-center text-green-300 font-semibold">{provider.ourCost}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gold text-black px-3 py-1 rounded-full text-sm font-bold">
                          {provider.savings}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-gray-400 mt-4 text-sm">
            * Costs shown per 1M tokens. Actual usage billed per token with no minimums.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative bg-chocolate-surface/20 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-gold shadow-xl shadow-gold/20 ring-2 ring-gold/30' 
                    : 'border-chocolate-surface/30 hover:border-chocolate-surface/60'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-gold to-gold-dark text-black px-4 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`w-full block text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-gold to-gold-dark text-black hover:from-gold-dark hover:to-gold shadow-lg hover:shadow-xl'
                      : 'bg-chocolate-surface border border-chocolate-surface/30 text-white hover:border-gold hover:bg-chocolate-surface/50'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-gold">How do you offer such low prices?</h3>
              <p className="text-gray-300 text-sm">
                We aggregate demand across thousands of developers, negotiate volume discounts, 
                and use intelligent routing to always find the best price-performance ratio.
              </p>
            </div>
            <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-gold">Is the quality the same?</h3>
              <p className="text-gray-300 text-sm">
                Absolutely. We use the exact same models from OpenAI, Anthropic, and others. 
                Your requests go directly to their APIs - we just route them intelligently.
              </p>
            </div>
            <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-gold">What about rate limits?</h3>
              <p className="text-gray-300 text-sm">
                Our pooled access means much higher effective rate limits. Plus, if one provider 
                is slow, we automatically route to alternatives.
              </p>
            </div>
            <div className="bg-chocolate-surface/20 backdrop-blur-sm border border-chocolate-surface/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-gold">Can I switch plans anytime?</h3>
              <p className="text-gray-300 text-sm">
                Yes! Upgrade or downgrade anytime. No lock-ins, no cancellation fees. 
                We prorate everything fairly.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-gold/10 to-gold-dark/10 border border-gold/20 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to cut your AI costs in half?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of developers saving 40-60% on AI API costs
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                href="/register"
                className="bg-gradient-to-r from-gold to-gold-dark text-black px-8 py-4 rounded-lg font-semibold text-lg hover:from-gold-dark hover:to-gold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Saving Now
              </Link>
              <Link
                href="/chat"
                className="border border-gold text-gold px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-200"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}