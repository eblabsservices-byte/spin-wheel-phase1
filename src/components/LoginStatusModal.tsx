'use client'

import { useState, useEffect } from 'react'
import Snowfall from 'react-snowfall'

type Step = 'start' | 'otp' | 'success'

interface LoginStatusModalProps {
  isOpen: boolean
  error?: string | null
  onSuccess: (data: { participantId: string; name: string; phone: string }) => void
}

export default function LoginStatusModal({ isOpen, error: initialError, onSuccess }: LoginStatusModalProps) {
  const [step, setStep] = useState<Step>('start')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [snowflakeImages, setSnowflakeImages] = useState<HTMLImageElement[]>([])

  useEffect(() => {
    if (initialError) setError(initialError)

    // Check for persisted OTP state on mount
    const savedState = localStorage.getItem('otp_flow_data');
    if (savedState) {
      try {
        const { phone: savedPhone, name: savedName, timestamp } = JSON.parse(savedState);
        const now = Date.now();
        // Valid for 5 minutes (same as OTP expiry)
        if (timestamp && (now - timestamp < 5 * 60 * 1000)) {
          setPhone(savedPhone);
          setName(savedName);
          setShowOtpInput(true);
          setStep('otp');
        } else {
          localStorage.removeItem('otp_flow_data');
        }
      } catch (e) {
        localStorage.removeItem('otp_flow_data');
      }
    }
  }, [initialError])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      // SAVE STATE to handle refresh
      localStorage.setItem('otp_flow_data', JSON.stringify({
        phone,
        name,
        timestamp: Date.now()
      }));

      setShowOtpInput(true);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp,
          name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      // Success: Clear persist state
      localStorage.removeItem('otp_flow_data');

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[5px] p-4 scrollbar-y-hidden">
      {/* <Snowfall
        snowflakeCount={40}
        radius={[10, 20]}
        images={snowflakeImages}
      /> */}
      <div
        className="relative z-10 flex flex-col gap-3 p-8 rounded-2xl w-full max-w-sm bg-white/20 
          border border-white/10 items-center justify-center
          shadow-[0_4px_20px_rgba(0,0,0,0.25),_inset_0_1px_2px_rgba(255,255,255,0.3)] overflow-hidden"
      >
        <span
          className="pointer-events-none absolute inset-0 z-[-5] rounded-2xl"
          style={{
            padding: "1px",
            background:
              "linear-gradient(135deg, #ff8a00, #e52e71, #9d50bb, #00c9ff, #92fe9d)",
            opacity: 0.60,
          }}
          aria-hidden="true"
        />

        {/* Brand Logo */}
        <div className="relative z-10  mb-4">
          <img src="/brand-logo-red.png" alt="Logo" className="w-60" />
        </div>

        <div className="relative text-center text-white w-full">
          <h2 className="text-2xl font-bold mb-2 ">
            {step === 'otp' ? 'Enter OTP' : 'Login to Spin'}
          </h2>
          <p className="text-gray-100 mb-6 text-sm">
            {step === 'otp' ? `Sent to +91 ${phone}` : 'Sign in securely to try your luck!'}
          </p>

          {!showOtpInput ? (
            <>
              {/* Name & Phone Form */}
              <form onSubmit={handleSendOtp} className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/80 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full p-3 rounded-xl bg-white/80 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Get OTP'}
                </button>
              </form>
            </>
          ) : (
            /* OTP Input Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-3 rounded-xl bg-white/80 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center tracking-widest text-xl font-bold"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Schema'}
              </button>
              <button
                type="button"
                  onClick={() => {
                    setStep('start');
                    setShowOtpInput(false);
                    localStorage.removeItem('otp_flow_data');
                  }}
                className="text-xs text-white underline"
              >
                Change Number
              </button>
            </form>
          )}

          {/* Google Login Only - COMMENTED OUT FOR JIO OTP FLOW 
          {step === 'start' && (
            <div className="">
              <a
                href="/api/auth/google/login"
                className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 hover:bg-gray-50 font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all active:scale-95"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                <span>Sign in with Google</span>
              </a>
            </div>
          )}
          */ }

          {error && <p className="mt-4 text-red-100 bg-red-500/50 p-2 rounded text-sm font-bold">{error}</p>}

          <p className="mt-6 text-xs text-gray-200">
            By continuing, you agree to our Terms & Conditions.
          </p>
        </div>
      </div>
    </div>

  )
}
