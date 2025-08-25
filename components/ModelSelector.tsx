// components/ModelSelector.tsx
// Multi-select model selector with availability indicators and cost preview

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ModelId, MODEL_CONFIGS, ModelConfig } from '@/types/ai-playground';
import { modelOrchestrator } from '@/lib/modelOrchestrator';

interface ModelSelectorProps {
  selectedModels: ModelId[];
  onSelectionChange: (models: ModelId[]) => void;
  mode: 'single' | 'multi';
  maxSelections?: number;
  showCostPreview?: boolean;
  showAvailability?: boolean;
  disabled?: boolean;
  favoriteModels?: ModelId[];
  onFavoriteToggle?: (modelId: ModelId) => void;
  className?: string;
}

interface ModelStatus {
  modelId: ModelId;
  availability: 'online' | 'offline' | 'degraded';
  responseTime: number;
  errorRate: number;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModels,
  onSelectionChange,
  mode,
  maxSelections = 8,
  showCostPreview = true,
  showAvailability = true,
  disabled = false,
  favoriteModels = [],
  onFavoriteToggle,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modelStatuses, setModelStatuses] = useState<Map<ModelId, ModelStatus>>(new Map());
  const [groupBy, setGroupBy] = useState<'provider' | 'capability' | 'cost'>('provider');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'speed' | 'quality'>('name');
  const [estimatedTokens, setEstimatedTokens] = useState(1000);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get model health status
  useEffect(() => {
    if (showAvailability) {
      const healthStatuses = modelOrchestrator.getHealthStatus();
      const statusMap = new Map<ModelId, ModelStatus>();
      
      healthStatuses.forEach(status => {
        statusMap.set(status.modelId, {
          modelId: status.modelId,
          availability: status.status as 'online' | 'offline' | 'degraded',
          responseTime: status.responseTime,
          errorRate: status.errorRate
        });
      });
      
      setModelStatuses(statusMap);
    }
  }, [showAvailability]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelToggle = (modelId: ModelId) => {
    if (disabled) return;

    if (mode === 'single') {
      onSelectionChange([modelId]);
      setIsOpen(false);
    } else {
      const newSelection = selectedModels.includes(modelId)
        ? selectedModels.filter(id => id !== modelId)
        : [...selectedModels, modelId].slice(0, maxSelections);
      
      onSelectionChange(newSelection);
    }
  };

  const handleFavoriteToggle = (modelId: ModelId, e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(modelId);
  };

  const calculateTotalCost = (): number => {
    return selectedModels.reduce((total, modelId) => {
      const config = MODEL_CONFIGS[modelId];
      return total + (config?.costPer1kTokens * (estimatedTokens / 1000) || 0);
    }, 0);
  };

  const getAvailabilityStatus = (modelId: ModelId) => {
    const status = modelStatuses.get(modelId);
    if (!status) return { color: 'bg-gray-400', label: 'Unknown' };

    switch (status.availability) {
      case 'online':
        return { 
          color: 'bg-green-400', 
          label: 'Online',
          responseTime: status.responseTime < 2000 ? 'Fast' : status.responseTime < 5000 ? 'Normal' : 'Slow'
        };
      case 'degraded':
        return { 
          color: 'bg-yellow-400', 
          label: 'Degraded',
          responseTime: 'Slow'
        };
      case 'offline':
        return { 
          color: 'bg-red-400', 
          label: 'Offline',
          responseTime: 'N/A'
        };
      default:
        return { color: 'bg-gray-400', label: 'Unknown' };
    }
  };

  const filterModels = (models: ModelConfig[]) => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.provider.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const groupModels = (models: ModelConfig[]) => {
    const filtered = filterModels(models);
    
    switch (groupBy) {
      case 'provider':
        return Object.entries(
          filtered.reduce((groups, model) => {
            const key = model.provider;
            if (!groups[key]) groups[key] = [];
            groups[key].push(model);
            return groups;
          }, {} as Record<string, ModelConfig[]>)
        );
      
      case 'capability':
        return Object.entries(
          filtered.reduce((groups, model) => {
            const key = model.strengths[0] || 'General';
            if (!groups[key]) groups[key] = [];
            groups[key].push(model);
            return groups;
          }, {} as Record<string, ModelConfig[]>)
        );
      
      case 'cost':
        return Object.entries(
          filtered.reduce((groups, model) => {
            const cost = model.costPer1kTokens;
            const key = cost < 0.001 ? 'Free' : 
                     cost < 0.01 ? 'Low Cost' : 
                     cost < 0.05 ? 'Medium Cost' : 'High Cost';
            if (!groups[key]) groups[key] = [];
            groups[key].push(model);
            return groups;
          }, {} as Record<string, ModelConfig[]>)
        );
      
      default:
        return [['All Models', filtered]];
    }
  };

  const sortModels = (models: ModelConfig[]) => {
    return [...models].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return a.costPer1kTokens - b.costPer1kTokens;
        case 'speed':
          const statusA = modelStatuses.get(a.id);
          const statusB = modelStatuses.get(b.id);
          return (statusA?.responseTime || 999999) - (statusB?.responseTime || 999999);
        case 'quality':
          // Simple quality heuristic based on context window and cost
          const qualityA = a.contextWindow * (1 / (a.costPer1kTokens + 0.001));
          const qualityB = b.contextWindow * (1 / (b.costPer1kTokens + 0.001));
          return qualityB - qualityA;
        default:
          return 0;
      }
    });
  };

  const allModels = Object.values(MODEL_CONFIGS);
  const groupedModels = groupModels(allModels);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selection Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input-vegas cursor-pointer flex items-center justify-between min-h-[48px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex-1">
          {selectedModels.length === 0 ? (
            <span className="text-[var(--text-muted)]">
              {mode === 'single' ? 'Select a model' : 'Select models for comparison'}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedModels.slice(0, 3).map(modelId => {
                const config = MODEL_CONFIGS[modelId];
                const status = getAvailabilityStatus(modelId);
                
                return (
                  <div
                    key={modelId}
                    className="flex items-center gap-2 bg-[var(--glass-bg)] px-2 py-1 rounded-lg text-sm"
                  >
                    <span className="text-lg">{config?.icon}</span>
                    <span className="font-mono text-xs">{modelId}</span>
                    {showAvailability && (
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    )}
                    {mode === 'multi' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModelToggle(modelId);
                        }}
                        className="text-[var(--text-muted)] hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              
              {selectedModels.length > 3 && (
                <div className="bg-[var(--glass-bg)] px-2 py-1 rounded-lg text-sm text-[var(--text-muted)]">
                  +{selectedModels.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showCostPreview && selectedModels.length > 0 && (
            <div className="text-xs text-[var(--vegas-gold)]">
              ~${calculateTotalCost().toFixed(3)}
            </div>
          )}
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-[var(--glass-border)] rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-vegas flex-1 text-sm"
              />
              {favoriteModels.length > 0 && (
                <button
                  onClick={() => onSelectionChange(favoriteModels.slice(0, maxSelections))}
                  className="btn-vegas-secondary text-xs px-3 py-2"
                  title="Select favorites"
                >
                  ⭐ Favorites
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                className="input-vegas text-xs flex-1"
              >
                <option value="provider">Group by Provider</option>
                <option value="capability">Group by Capability</option>
                <option value="cost">Group by Cost</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="input-vegas text-xs flex-1"
              >
                <option value="name">Sort by Name</option>
                <option value="cost">Sort by Cost</option>
                <option value="speed">Sort by Speed</option>
                <option value="quality">Sort by Quality</option>
              </select>
            </div>

            {showCostPreview && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-[var(--text-muted)]">Est. tokens:</label>
                <input
                  type="number"
                  value={estimatedTokens}
                  onChange={(e) => setEstimatedTokens(Number(e.target.value))}
                  className="input-vegas text-xs w-20"
                  min="100"
                  max="100000"
                  step="100"
                />
              </div>
            )}
          </div>

          {/* Model List */}
          <div className="overflow-y-auto max-h-80">
            {groupedModels.map(([groupName, models]) => (
              <div key={groupName}>
                {groupedModels.length > 1 && (
                  <div className="px-4 py-2 bg-[var(--glass-bg)] text-sm font-semibold text-[var(--text-secondary)] capitalize">
                    {groupName}
                  </div>
                )}
                
                {sortModels(models).map(model => {
                  const isSelected = selectedModels.includes(model.id);
                  const isFavorite = favoriteModels.includes(model.id);
                  const status = getAvailabilityStatus(model.id);
                  const cost = model.costPer1kTokens * (estimatedTokens / 1000);
                  
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleModelToggle(model.id)}
                      className={`px-4 py-3 cursor-pointer transition-all hover:bg-[var(--glass-bg-hover)] border-l-4 ${
                        isSelected 
                          ? 'bg-[var(--glass-bg-active)] border-l-[var(--vegas-gold)]' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{model.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[var(--text-primary)]">
                                {model.name}
                              </span>
                              {showAvailability && (
                                <div className={`w-2 h-2 rounded-full ${status.color}`} title={status.label} />
                              )}
                              {onFavoriteToggle && (
                                <button
                                  onClick={(e) => handleFavoriteToggle(model.id, e)}
                                  className={`text-sm transition-colors ${
                                    isFavorite ? 'text-yellow-400' : 'text-[var(--text-muted)] hover:text-yellow-400'
                                  }`}
                                >
                                  ⭐
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-1">
                              {model.description}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-muted)]">
                              <span>Context: {(model.contextWindow / 1000).toFixed(0)}K</span>
                              <span>Cost: ${model.costPer1kTokens.toFixed(4)}/1K</span>
                              {showAvailability && status.responseTime !== 'N/A' && (
                                <span>Speed: {status.responseTime}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {showCostPreview && (
                            <div className="text-xs text-[var(--vegas-gold)]">
                              ${cost.toFixed(3)}
                            </div>
                          )}
                          
                          {mode === 'multi' && (
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-[var(--vegas-gold)] border-[var(--vegas-gold)] text-[var(--vegas-black)]' 
                                : 'border-[var(--glass-border)]'
                            }`}>
                              {isSelected && <span className="text-xs">✓</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Strengths/Weaknesses */}
                      {isSelected && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="font-medium text-green-400 mb-1">Strengths:</div>
                            {model.strengths.slice(0, 3).map(strength => (
                              <div key={strength} className="text-[var(--text-muted)]">• {strength}</div>
                            ))}
                          </div>
                          <div>
                            <div className="font-medium text-orange-400 mb-1">Considerations:</div>
                            {model.weaknesses.slice(0, 3).map(weakness => (
                              <div key={weakness} className="text-[var(--text-muted)]">• {weakness}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          {mode === 'multi' && (
            <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--glass-bg)]">
              <div className="flex items-center justify-between text-sm">
                <div className="text-[var(--text-muted)]">
                  {selectedModels.length}/{maxSelections} models selected
                </div>
                
                <div className="flex gap-2">
                  {selectedModels.length > 0 && (
                    <button
                      onClick={() => onSelectionChange([])}
                      className="btn-vegas-secondary text-xs px-3 py-1"
                    >
                      Clear All
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn-vegas-primary text-xs px-3 py-1"
                  >
                    Done
                  </button>
                </div>
              </div>
              
              {showCostPreview && selectedModels.length > 0 && (
                <div className="mt-2 text-xs text-[var(--vegas-gold)]">
                  Total estimated cost: ${calculateTotalCost().toFixed(3)} for {estimatedTokens} tokens
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;