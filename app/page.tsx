export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gold to-orange-500 bg-clip-text text-transparent">
          EXPREZZZ Power
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Advanced AI Chat Platform
        </p>
        <div className="space-x-4">
          <a 
            href="/login" 
            className="px-6 py-3 bg-gradient-to-r from-gold to-orange-500 text-black font-bold rounded-lg hover:from-orange-500 hover:to-gold transition-all inline-block"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  )
}