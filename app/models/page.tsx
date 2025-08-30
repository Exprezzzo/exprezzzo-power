"use client";

import catalog from "@/lib/providers/catalog.json";

export default function ModelsPage() {
  return (
    <div className="min-h-screen p-8 bg-bgDark dark:bg-bgLight text-textDark dark:text-textLight">
      <h1 className="text-4xl font-brand mb-8">Express Power Model Directory</h1>
      <p className="text-lg mb-8 text-gray-400">Access all major AI providers through one unified API</p>
      
      <div className="grid grid-cols-3 gap-6">
        {catalog.map(provider => (
          <div 
            key={provider.id} 
            className="p-6 bg-surfaceDark dark:bg-surfaceLight rounded-2xl glass"
          >
            <h3 className="text-xl font-brand mb-2">{provider.name}</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              provider.status === "available" 
                ? "bg-green-500/20 text-green-400" 
                : "bg-gray-500/20 text-gray-400"
            }`}>
              {provider.status === "available" ? "Available" : "Coming Soon"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}