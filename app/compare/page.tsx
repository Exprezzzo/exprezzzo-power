"use client";

import { useState } from "react";
import catalog from "@/lib/providers/catalog.json";

export default function ComparePage() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  
  const available = catalog.providers.filter(p => p.status === "available");
  
  const runCompare = async () => {
    for (const model of selected) {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt, model })
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.content) content += data.content;
              } catch {}
            }
          }
        }
      }
      
      setResults(prev => ({ ...prev, [model]: content }));
    }
  };
  
  return (
    <div className="min-h-screen p-8 bg-bgDark dark:bg-bgLight text-textDark dark:text-textLight">
      <h1 className="text-4xl font-bold mb-8">Quick Compare</h1>
      
      <textarea
        className="w-full p-4 bg-surfaceDark dark:bg-surfaceLight rounded-lg mb-6"
        rows={4}
        placeholder="Enter prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      
      <div className="flex gap-2 mb-6">
        {available.map(p => p.models?.map(m => (
          <button
            key={`${p.id}/${m.id}`}
            onClick={() => {
              const key = `${p.id}/${m.id}`;
              setSelected(prev => prev.includes(key) 
                ? prev.filter(k => k !== key) 
                : [...prev, key].slice(0, 5)
              );
            }}
            className={`px-4 py-2 rounded-lg ${
              selected.includes(`${p.id}/${m.id}`) 
                ? "bg-primary text-black" 
                : "bg-surfaceDark dark:bg-surfaceLight"
            }`}
          >
            {m.id}
          </button>
        )))}
      </div>
      
      <button
        onClick={runCompare}
        className="px-8 py-3 bg-primary text-black rounded-lg font-bold"
      >
        Compare
      </button>
      
      <div className="grid grid-cols-3 gap-4 mt-8">
        {selected.map(model => (
          <div key={model} className="p-4 bg-surfaceDark dark:bg-surfaceLight rounded-lg">
            <h3 className="font-bold mb-2">{model}</h3>
            <p>{results[model] || "..."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}