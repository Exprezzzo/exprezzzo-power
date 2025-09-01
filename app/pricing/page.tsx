export default function Page() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-8 text-center">
          Coming Soon
        </h1>
        <div className="bg-[var(--surface)] rounded-xl p-8 backdrop-blur-sm border border-[#FFD700]/20">
          <p className="text-white/80 text-lg text-center">
            This feature is under development and will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}
