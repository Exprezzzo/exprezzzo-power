'use client'

import { useState } from 'react'

const AVAILABLE_MODELS = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
  { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'meta' }
]

export default function ComparePage() {
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(prev => prev.filter(id => id !== modelId))
    } else if (selectedModels.length < 5) {
      setSelectedModels(prev => [...prev, modelId])
    }
  }
  
  const runComparison = async () => {
    setLoading(true)
    setResults({})
    
    const promises = selectedModels.map(async (modelId) => {
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: modelId })
        })
        
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let content = ''
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.content) content += data.content
                } catch {}
              }
            }
          }
        }
        
        const latency = Date.now() - startTime
        const cost = 0.002 * (content.length / 1000) // Mock cost calculation
        
        setResults(prev => ({
          ...prev,
          [modelId]: { content, latency, cost, timestamp: new Date().toISOString() }
        }))
      } catch (error) {
        setResults(prev => ({
          ...prev,
          [modelId]: { error: error.message, timestamp: new Date().toISOString() }
        }))
      }
    })
    
    await Promise.all(promises)
    setLoading(false)
  }
  
  const exportResults = () => {
    const data = {
      prompt,
      models: selectedModels,
      results,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compare-${Date.now()}.json`
    a.click()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Quick Compare</h1>
      
      <div className="max-w-6xl mx-auto">
        <textarea
          className="w-full p-4 bg-gray-800 text-white rounded-lg border border-gray-700 mb-6"
          rows={4}
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2 mb-6">
          {AVAILABLE_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => toggleModel(model.id)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedModels.includes(model.id)
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {model.name}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={runComparison}
            disabled={!prompt || selectedModels.length === 0 || loading}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Comparing...' : 'Compare Models'}
          </button>
          
          {Object.keys(results).length > 0 && (
            <button
              onClick={exportResults}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg"
            >
              Export Results
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedModels.map(modelId => {
            const result = results[modelId]
            const model = AVAILABLE_MODELS.find(m => m.id === modelId)
            
            return (
              <div key={modelId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="font-bold text-white mb-2">{model?.name}</h3>
                
                {result ? (
                  result.error ? (
                    <p className="text-red-400">Error: {result.error}</p>
                  ) : (
                    <>
                      <p className="text-gray-300 mb-2">{result.content}</p>
                      <div className="text-sm text-gray-500 mt-4">
                        <p>Latency: {result.latency}ms</p>
                        <p>Est. Cost: ${result.cost.toFixed(4)}</p>
                      </div>
                    </>
                  )
                ) : (
                  loading && <p className="text-gray-500">Waiting...</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}