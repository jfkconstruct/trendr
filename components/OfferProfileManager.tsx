'use client'

import { useState, useEffect } from 'react'

interface OfferProfile {
  id: string
  name: string
  problem: string
  promise: string
  proof: string
  pitch: string
  brandVoice?: string
  constraints?: any
}

interface OfferProfileManagerProps {
  projectId: string
  selectedProfileId?: string
  onProfileSelected?: (profileId: string) => void
  onProfileCreated?: () => void
}

export function OfferProfileManager({ 
  projectId, 
  selectedProfileId, 
  onProfileSelected,
  onProfileCreated
}: OfferProfileManagerProps) {
  const [profiles, setProfiles] = useState<OfferProfile[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingProfile, setEditingProfile] = useState<OfferProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    problem: '',
    promise: '',
    proof: '',
    pitch: '',
    brandVoice: '',
    constraints: ''
  })

  // Fetch offer profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch(`/api/offers?projectId=${projectId}`)
        const data = await response.json()
        if (data.profiles) {
          setProfiles(data.profiles)
        }
      } catch (error) {
        console.error('Error fetching profiles:', error)
        // No toast in this simplified version
      }
    }

    if (projectId) {
      fetchProfiles()
    }
  }, [projectId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        projectId,
        name: formData.name,
        problem: formData.problem,
        promise: formData.promise,
        proof: formData.proof,
        pitch: formData.pitch,
        brandVoice: formData.brandVoice,
        constraints: formData.constraints ? JSON.parse(formData.constraints) : null
      }

      let response
      if (editingProfile) {
        // Update existing profile
        response = await fetch(`/api/offers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingProfile.id })
        })
      } else {
        // Create new profile
        response = await fetch(`/api/offers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await response.json()
      
      if (response.ok) {
        // Reset form and refresh profiles
        setFormData({
          name: '',
          problem: '',
          promise: '',
          proof: '',
          pitch: '',
          brandVoice: '',
          constraints: ''
        })
        setEditingProfile(null)
        setIsCreating(false)
        
        // Refresh profiles
        const refreshResponse = await fetch(`/api/offers?projectId=${projectId}`)
        const refreshData = await refreshResponse.json()
        if (refreshData.profiles) {
          setProfiles(refreshData.profiles)
          onProfileCreated?.()
        }
      } else {
        throw new Error(data.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      // No toast in this simplified version
    }
  }

  const handleEdit = (profile: OfferProfile) => {
    setEditingProfile(profile)
    setFormData({
      name: profile.name,
      problem: profile.problem,
      promise: profile.promise,
      proof: profile.proof,
      pitch: profile.pitch,
      brandVoice: profile.brandVoice || '',
      constraints: profile.constraints ? JSON.stringify(profile.constraints, null, 2) : ''
    })
    setIsCreating(true)
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this offer profile?')) {
      return
    }

    try {
      const response = await fetch(`/api/offers?id=${profileId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh profiles
        const refreshResponse = await fetch(`/api/offers?projectId=${projectId}`)
        const refreshData = await refreshResponse.json()
        if (refreshData.profiles) {
          setProfiles(refreshData.profiles)
        }
      } else {
        throw new Error(data.error || 'Failed to delete profile')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      // No toast in this simplified version
    }
  }

  const handleSelectProfile = (profileId: string) => {
    onProfileSelected?.(profileId)
  }

  // Render form for creating/editing
  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          {editingProfile ? 'Edit Offer Profile' : 'Create Offer Profile'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Profile Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Problem</label>
            <textarea
              name="problem"
              value={formData.problem}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Promise</label>
            <textarea
              name="promise"
              value={formData.promise}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Proof</label>
            <textarea
              name="proof"
              value={formData.proof}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Pitch</label>
            <textarea
              name="pitch"
              value={formData.pitch}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Brand Voice</label>
            <textarea
              name="brandVoice"
              value={formData.brandVoice}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Constraints (JSON)</label>
            <textarea
              name="constraints"
              value={formData.constraints}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder='{"tone": "professional", "length": "short"}'
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingProfile ? 'Update Profile' : 'Create Profile'}
            </button>
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              onClick={() => {
                setIsCreating(false)
                setEditingProfile(null)
                setFormData({
                  name: '',
                  problem: '',
                  promise: '',
                  proof: '',
                  pitch: '',
                  brandVoice: '',
                  constraints: ''
                })
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Render list of profiles
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Offer Profiles</h3>
        <button 
          onClick={() => {
            setEditingProfile(null)
            setFormData({
              name: '',
              problem: '',
              promise: '',
              proof: '',
              pitch: '',
              brandVoice: '',
              constraints: ''
            })
            setIsCreating(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No offer profiles created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{profile.name}</h4>
                {selectedProfileId === profile.id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Selected</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Problem:</span> {profile.problem.substring(0, 50)}...
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Promise:</span> {profile.promise.substring(0, 50)}...
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">4Ps</span>
                {profile.brandVoice && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Brand Voice</span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSelectProfile(profile.id)}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Select
                </button>
                <button 
                  onClick={() => handleEdit(profile)}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(profile.id)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
