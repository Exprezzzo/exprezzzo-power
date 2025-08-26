export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4 text-amber-500">Dashboard</h1>
      <div className="grid gap-4">
        <div className="bg-gray-900 p-6 rounded-lg border border-amber-500/20">
          <h2 className="text-xl font-semibold mb-2">Community Savings</h2>
          <p className="text-3xl font-bold text-emerald-400">40% Cheaper</p>
        </div>
      </div>
    </div>
  );
}
