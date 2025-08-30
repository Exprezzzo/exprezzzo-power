export default function ModelsPage() {
  const models = [
    { provider: 'OpenAI', model: 'GPT-4', price: '$30/1M tokens', savings: '40%' },
    { provider: 'OpenAI', model: 'GPT-3.5', price: '$0.50/1M tokens', savings: '40%' },
    { provider: 'Anthropic', model: 'Claude 3 Opus', price: '$15/1M tokens', savings: '40%' },
    { provider: 'Anthropic', model: 'Claude 3 Haiku', price: '$0.25/1M tokens', savings: '40%' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="font-brand text-3xl gold-gradient-text mb-6">Models</h1>
      
      <div className="surface rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gold/10 border-b border-gold/20">
            <tr>
              <th className="p-4 text-left">Provider</th>
              <th className="p-4 text-left">Model</th>
              <th className="p-4 text-left">Our Price</th>
              <th className="p-4 text-left">Your Savings</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, idx) => (
              <tr key={idx} className="border-b border-gold/10">
                <td className="p-4">{model.provider}</td>
                <td className="p-4">{model.model}</td>
                <td className="p-4">{model.price}</td>
                <td className="p-4 gold-gradient-text font-bold">{model.savings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}