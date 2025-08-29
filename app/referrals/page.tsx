'use client'

import { useState } from 'react'

export default function ReferralsPage() {
  const [referralLink] = useState(`https://expresso.power/?ref=user123`)
  const [referralCount] = useState(7)
  const [copied, setCopied] = useState(false)
  
  const milestones = [
    { count: 10, reward: '50% off', reached: false },
    { count: 20, reward: '75% off', reached: false },
    { count: 30, reward: 'Free Pro', reached: false },
  ]
  
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const shareOnX = () => {
    window.open(`https://x.com/intent/tweet?text=Save%2040%25%20on%20AI%20with%20Expresso%20Power&url=${encodeURIComponent(referralLink)}`)
  }
  
  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Referral Program</h1>
        
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Your Referral Link</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
            <button
              onClick={copyLink}
              className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-semibold"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Share & Earn</h2>
          <div className="flex gap-4">
            <button
              onClick={shareOnX}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Share on X
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Share on LinkedIn
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Progress: {referralCount} referrals
          </h2>
          
          <div className="relative mb-8">
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-yellow-500 h-4 rounded-full transition-all"
                style={{ width: `${(referralCount / 30) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.count}
                className={`flex justify-between items-center p-4 rounded-lg ${
                  referralCount >= milestone.count
                    ? 'bg-green-900/30 border border-green-500'
                    : 'bg-gray-700'
                }`}
              >
                <span className="text-white">
                  {milestone.count} referrals: {milestone.reward}
                </span>
                {referralCount >= milestone.count && (
                  <span className="text-green-400">✓ Achieved</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}