'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface StoreConfig {
  id: number
  name: string
  storeName: string | null
  storeTagline: string | null
  storeAddress: string | null
  storePhone: string | null
  storeEmail: string | null
  storeWebsite: string | null
  storeLogo: string | null
  storeTheme: string | null
  storeCurrency: string | null
  storeTimezone: string | null
  businessLicense: string | null
  taxNumber: string | null
  bankDetails: any
}

export default function StoreConfigForm() {
  const [config, setConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStoreConfig()
  }, [])

  const fetchStoreConfig = async () => {
    try {
      const response = await fetch('/api/tenant/config?tenantId=1')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else {
        setMessage('Failed to load store configuration')
      }
    } catch (error) {
      setMessage('Error loading store configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setIsSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/tenant/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: config.id, ...config }),
      })

      if (response.ok) {
        setMessage('Store configuration updated successfully!')
      } else {
        setMessage('Failed to update store configuration')
      }
    } catch (error) {
      setMessage('Error updating store configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof StoreConfig, value: string) => {
    if (!config) return
    setConfig({ ...config, [field]: value })
  }

  if (isLoading) {
    return <div className="p-6">Loading store configuration...</div>
  }

  if (!config) {
    return <div className="p-6">Failed to load store configuration</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Store Configuration</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Store Name</label>
            <input
              type="text"
              value={config.storeName || ''}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Your Store Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Store Tagline</label>
            <input
              type="text"
              value={config.storeTagline || ''}
              onChange={(e) => handleInputChange('storeTagline', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Your Store Tagline"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Store Address</label>
            <textarea
              value={config.storeAddress || ''}
              onChange={(e) => handleInputChange('storeAddress', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Your Store Address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={config.storePhone || ''}
              onChange={(e) => handleInputChange('storePhone', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={config.storeEmail || ''}
              onChange={(e) => handleInputChange('storeEmail', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="info@yourstore.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              value={config.storeWebsite || ''}
              onChange={(e) => handleInputChange('storeWebsite', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourstore.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              value={config.storeCurrency || 'USD'}
              onChange={(e) => handleInputChange('storeCurrency', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={config.storeTheme || 'light'}
              onChange={(e) => handleInputChange('storeTheme', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business License</label>
            <input
              type="text"
              value={config.businessLicense || ''}
              onChange={(e) => handleInputChange('businessLicense', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="License Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tax Number</label>
            <input
              type="text"
              value={config.taxNumber || ''}
              onChange={(e) => handleInputChange('taxNumber', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Tax ID Number"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="px-6 py-2"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </div>
  )
}