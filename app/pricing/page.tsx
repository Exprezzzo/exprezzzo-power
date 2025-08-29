export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: [
        '10 API calls/month to low-cost models',
        'Basic support',
        'Community access'
      ]
    },
    {
      name: 'Pro',
      price: '$49',
      features: [
        'Unlimited API calls',
        'All models access',
        'Priority support',
        'Usage analytics'
      ]
    },
    {
      name: 'Power',
      price: '$97',
      features: [
        'Everything in Pro',
        'Custom model routing',
        'Team collaboration',
        'Advanced analytics',
        'SLA guarantee'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: [
        'Volume pricing',
        'Dedicated support',
        'Custom integrations',
        'SOC2 compliance'
      ]
    }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          One plan, all features. No hidden costs.
        </p>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-12">
          <p className="text-yellow-400 text-center">
            ⚡ Platform fee: Pass-through provider cost + 60% minimum. Save up to 40% vs direct!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`bg-gray-800 rounded-2xl p-6 border ${
                plan.popular ? 'border-yellow-500' : 'border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-4xl font-bold text-white mb-6">
                {plan.price}
                {plan.price !== 'Custom' && <span className="text-lg text-gray-400">/month</span>}
              </p>
              <ul className="space-y-3">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full mt-6 py-3 rounded-lg font-semibold ${
                plan.popular
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white'
              }`}>
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}