'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ModelSelectorProps {
  onModelChange: (model: string) => void
  currentModel?: string
}

// Available OpenRouter models with descriptions
const OPENROUTER_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Fast, intelligent, and capable',
    provider: 'Anthropic'
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fastest and most compact',
    provider: 'Anthropic'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable multimodal model',
    provider: 'OpenAI'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Most cost efficient',
    provider: 'OpenAI'
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google\'s most capable model',
    provider: 'Google'
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Open source model',
    provider: 'Meta'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'Cost-effective alternative',
    provider: 'DeepSeek'
  }
]

export default function ModelSelector({ onModelChange, currentModel }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel || OPENROUTER_MODELS[0].id)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSelectedModel(currentModel || OPENROUTER_MODELS[0].id)
  }, [currentModel])

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    onModelChange(modelId)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">LLM Model</label>
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {OPENROUTER_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-500">{model.provider} • {model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">
        Choose the model that best fits your needs. Different models offer varying performance and cost characteristics.
      </p>
    </div>
  )
}
