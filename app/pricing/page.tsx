"use client";

import { useState } from "react";

export default function PricingPage() {
  const [mode, setMode] = useState<"api" | "ui">("ui");
  
  const plans = [
    {
      name: "Free",
      apiPrice: "$0",
      uiPrice: "$0",
      features: ["10 API calls/month", "Basic models only"]
    },
    {
      name: "Pro",
      apiPrice: "$29",
      uiPrice: "$49",
      features: ["Unlimited API calls", "All models", "Priority support"]
    },
    {
      name: "Power",
      apiPrice: "$79",
      uiPrice: "$97",
      features: [
        "Everything in Pro",
        "Custom routing",
        "Team features",
        "Express AI Protocol benefits"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      apiPrice: "Custom",
      uiPrice: "Custom",
      features: ["Volume pricing", "SLA", "Dedicated support"]
    }
  ];
  
  return (
    <div className="min-h-screen p-8 bg-bgDark dark:bg-bgLight text-textDark dark:text-textLight">
      <h1 className="text-5xl font-brand text-center mb-4">Express Power Network Pricing</h1>
      <p className="text-center text-xl mb-2 text-primary">No lock-in. Always the best deal.</p>
      <p className="text-center text-lg mb-2 text-gray-400">Transparent 50% margins — always fair.</p>
      <p className="text-center text-lg mb-8 text-gray-400">Your data, your models, your savings.</p>
      
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setMode("api")}
          className={`px-6 py-2 rounded-lg ${mode === "api" ? "bg-primary text-black" : "bg-surfaceDark dark:bg-surfaceLight"}`}
        >
          API Only
        </button>
        <button 
          onClick={() => setMode("ui")}
          className={`px-6 py-2 rounded-lg ${mode === "ui" ? "bg-primary text-black" : "bg-surfaceDark dark:bg-surfaceLight"}`}
        >
          UI + API
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-6 max-w-6xl mx-auto">
        {plans.map(plan => (
          <div 
            key={plan.name}
            className={`p-6 rounded-2xl bg-surfaceDark dark:bg-surfaceLight ${
              plan.popular ? "border-t-4 ep-gold-gradient" : "border border-gray-600"
            }`}
          >
            <h3 className="text-2xl font-brand mb-2">{plan.name}</h3>
            <p className="text-4xl font-bold mb-6">
              {mode === "api" ? plan.apiPrice : plan.uiPrice}
              <span className="text-sm">/month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-lg font-bold ${
              plan.popular ? "bg-primary text-black" : "bg-gray-700"
            }`}>
              {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}