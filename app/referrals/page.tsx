"use client";

import { useState } from "react";

export default function NetworkPage() {
  const [link] = useState("https://express.power/?ref=user123");
  const [count] = useState(7);
  const [copied, setCopied] = useState(false);
  
  const milestones = [
    { count: 10, reward: "50% off" },
    { count: 20, reward: "75% off" },
    { count: 30, reward: "Free Pro" }
  ];
  
  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="min-h-screen p-8 bg-bgDark dark:bg-bgLight text-textDark dark:text-textLight">
      <h1 className="text-4xl font-brand mb-8">Express Power Network</h1>
      <p className="text-lg mb-8">Help democratize AI access. Every person you bring strengthens the network.</p>
      
      <div className="bg-surfaceDark dark:bg-surfaceLight rounded-2xl p-6 mb-8 glass">
        <h2 className="text-xl font-brand mb-4">Your Network Link</h2>
        <div className="flex gap-2">
          <input 
            value={link} 
            readOnly 
            className="flex-1 bg-gray-700 px-4 py-2 rounded-lg" 
          />
          <button 
            onClick={copy}
            className="px-6 py-2 bg-primary text-black rounded-lg font-bold"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      
      <div className="bg-surfaceDark dark:bg-surfaceLight rounded-2xl p-6 glass">
        <h2 className="text-xl font-brand mb-4">People Freed: {count}</h2>
        <div className="w-full bg-gray-700 rounded-full h-4 mb-8">
          <div 
            className="bg-primary h-4 rounded-full transition-all"
            style={{ width: `${(count / 30) * 100}%` }}
          />
        </div>
        <div className="space-y-4">
          {milestones.map(m => (
            <div 
              key={m.count}
              className={`p-4 rounded-lg ${
                count >= m.count 
                  ? "bg-green-900/30 border border-green-500" 
                  : "bg-gray-700"
              }`}
            >
              <span>{m.count} people freed: {m.reward}</span>
              {count >= m.count && <span className="ml-4 text-green-400">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}