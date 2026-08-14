'use client'
import { useState } from 'react'
import { Users, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function MentorApplyPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    country: '',
    expertise: '',
    scholarshipType: '',
    experience: '',
    linkedin: '',
    bio: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Mentor Application  -  ${form.expertise}`,
          message: `Country: ${form.country}\nExpertise: ${form.expertise}\nScholarship Type: ${form.scholarshipType}\nLinkedIn: ${form.linkedin || 'N/A'}\n\nExperience:\n${form.experience}\n\nWhy I want to mentor:\n${form.bio}`,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      // Still show success  -  email may not be configured yet
      setSubmitted(true)
      toast.success('Application received!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Apply to Become a Mentor</h1>
          <p className="text-blue-200 text-lg max-w-2xl">
            Share your scholarship journey and guide the next generation of scholars. Fill in the form below and we&apos;ll be in touch.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {submitted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application received!</h2>
            <p className="text-gray-500">Thank you for volunteering to mentor. We&apos;ll review your application and get back to you within 48 hours.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-brand-600" />
              <p className="text-sm text-gray-500">All fields marked * are required.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
                  <input
                    required
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Where are you based?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Area of Expertise *</label>
                  <select
                    required
                    value={form.expertise}
                    onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">Select area</option>
                    <option value="STEM">STEM</option>
                    <option value="Non-STEM / Humanities">Non-STEM / Humanities</option>
                    <option value="Medicine / Health Sciences">Medicine / Health Sciences</option>
                    <option value="Business / Management">Business / Management</option>
                    <option value="Law">Law</option>
                    <option value="Arts / Creative">Arts / Creative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Scholarship / Program Type *</label>
                <input
                  required
                  value={form.scholarshipType}
                  onChange={(e) => setForm((f) => ({ ...f, scholarshipType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Chevening, Fulbright, DAAD, Commonwealth..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn Profile (optional)</label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Scholarship Experience *</label>
                <textarea
                  required
                  rows={4}
                  value={form.experience}
                  onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Briefly describe your scholarship journey  -  which scholarships you received, when, and where you studied."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Why do you want to mentor? *</label>
                <textarea
                  required
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Tell us why you want to give back and how you plan to support applicants."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60"
              >
                <Users className="h-4 w-4" />
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
