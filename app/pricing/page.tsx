export default function PricingPage() {
  const tiers = [
    {
      name: 'Community',
      price: 'Free',
      features: ['10 requests/day', 'Basic models', 'Community support'],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Power',
      price: '$29/mo',
      features: ['Unlimited requests', 'All models', '40% cheaper than direct', 'Priority support'],
      cta: 'Start Saving',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Volume pricing', 'Dedicated support', 'Custom integrations', 'SLA'],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="font-brand text-3xl gold-gradient-text mb-6">Pricing</h1>
      
      <div className="text-center mb-8">
        <p className="text-xl text-muted">Transparent 50% margins. No hidden fees.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`surface rounded-xl p-6 ${
              tier.popular ? 'ring-2 ring-gold power-tier-card' : ''
            }`}
          >
            {tier.popular && (
              <div className="gold-gradient text-black text-sm px-3 py-1 rounded-full inline-block mb-4">
                Most Popular
              </div>
            )}
            <h2 className="font-brand text-2xl mb-2">{tier.name}</h2>
            <div className="text-3xl font-bold mb-6 gold-gradient-text">{tier.price}</div>
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gold">✓</span>
                  <span className="text-muted">{feature}</span>
                </li>
              ))}
            </ul>
            <button className={tier.popular ? 'cta-button w-full' : 'w-full p-3 rounded-lg surface border border-gold/20 hover:border-gold transition-colors'}>
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}