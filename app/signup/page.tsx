'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Eye, EyeOff, Loader2, X, AlertCircle, Shield, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';

// --- PROFESSIONAL GOOGLE ICON ---
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.23895)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  
  // State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Account created successfully');
  const [progress, setProgress] = useState(0);

  // 🟢 DYNAMIC TITLE FIX
  useEffect(() => {
    document.title = "Sign Up - TruthHire";
  }, []);

  // Helper: Handle Success & Dynamic Redirect
  const handleSuccessRedirect = (isNewUser: boolean, name: string) => {
    // If it's a new user -> "Account Created", if existing -> "Welcome back"
    const msg = isNewUser ? `Account created successfully!` : `Welcome back, ${name.split(' ')[0]}!`;
    setSuccessMessage(msg);
    
    setShowSuccessModal(true);
    setProgress(0);

    // 1. Start Animation
    setTimeout(() => {
        setProgress(100);
    }, 100);

    // 2. Redirect when animation completes
    setTimeout(() => {
        if (isNewUser) router.push('/onboarding');
        else router.push('/jobs'); // or Home '/'
    }, 1600);
  };

  // --- 1. SMART GOOGLE AUTH ---
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      // We removed the toast here to rely on button spinner + final modal
      
      try {
        const res = await fetch('http://localhost:8000/users/google-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user_id', data.user_id);
          localStorage.setItem('user_name', data.name);
          window.dispatchEvent(new Event('auth-change'));
          
          // Show Success Modal
          handleSuccessRedirect(data.is_new_user, data.name);
        } else {
          const errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          throw new Error(errMsg || "Google Auth Failed");
        }
      } catch (err: any) {
        toast.error(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google Pop-up failed'),
  });

  // --- 2. EMAIL SIGNUP (With Duplicate Check) ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 6) { 
        setError('Password must be at least 6 characters'); 
        return; 
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.requires_otp) {
        toast.success('Verification code sent!'); // Keep toast for OTP sent (informational)
        setShowOtpModal(true);
      } else {
        if (response.status === 400 && JSON.stringify(data.detail).toLowerCase().includes("registered")) {
            toast.error("Account exists. Redirecting to login...", { duration: 3000 });
            setTimeout(() => router.push('/login'), 2000);
            return;
        }

        const errMsg = typeof data.detail === 'string' ? data.detail : "Signup failed";
        setError(errMsg);
      }
    } catch (error) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. OTP LOGIC ---
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { setError('Enter full 6-digit code'); return; }
    
    setVerifying(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/users/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpCode })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_name', data.name);
        window.dispatchEvent(new Event('auth-change'));
        
        // Hide OTP Modal & Show Success Modal
        setShowOtpModal(false);
        handleSuccessRedirect(true, data.name); // True because this is signup flow
      } else {
        setError(data.detail || 'Invalid verification code');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) { 
      setError('Verification failed'); 
    } finally { 
      setVerifying(false); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] p-4 font-sans text-white relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 bg-[#09090b]"></div>
      <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-[#09090b]/40 to-[#09090b] blur-[80px] pointer-events-none"></div>

      {/* --- MAIN CARD (Compact) --- */}
      <div className="w-full max-w-[25rem] bg-[#131316] border border-[#27272a] rounded-xl p-6 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)] relative z-10 flex flex-col gap-5">
        
        {/* 1. Header */}
        <div className="text-center">
             <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2 hover:opacity-80 transition-opacity">
                <div className="bg-blue-600/10 p-1.5 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">TruthHire.</span>
             </Link>
             <h1 className="text-[16px] font-semibold text-white">Create your account</h1>
             <p className="text-[#a1a1aa] text-[14px] mt-0.5">Welcome! Please fill in the details to get started.</p>
        </div>

        {/* 2. Google Button */}
        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] text-white text-xs font-medium h-9 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" /> : (
            <>
              <GoogleIcon />
              <span className="text-[14px] font-medium text-gray-300">Continue with Google</span>
            </>
          )}
        </button>

        {/* 3. Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-[#27272a] flex-1"></div>
          <span className="text-[14px] text-[#71717a] font-medium lowercase">or</span>
          <div className="h-px bg-[#27272a] flex-1"></div>
        </div>

        {/* 4. Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          
          {error && !showOtpModal && (
            <div className="bg-red-500/10 border border-red-500/10 p-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-red-400 text-[11px] font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[14px] font-medium text-[#f6f6f7] block ml-0.5">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 rounded-lg px-3 h-9 text-[14px] text-white placeholder-[#3f3f46] outline-none transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[14px] font-medium text-[#f6f6f7] block ml-0.5">Email address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 rounded-lg px-3 h-9 text-[14px] text-white placeholder-[#3f3f46] outline-none transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[14px] font-medium text-[#f6f6f7] block ml-0.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 rounded-lg px-3 h-9 text-[14px] text-white placeholder-[#3f3f46] outline-none transition-all pr-8"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-400 hover:bg-blue-500 text-black font-bold h-9 rounded-lg transition-all mt-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_0_1px_rgba(37,99,235,1)] text-[14px]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Continue'}
          </button>
        </form>

        {/* 5. Footer Links */}
        <div className="text-center pt-2">
            <p className="text-[14px] text-[#71717a]">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium hover:underline">
                    Sign in
                </Link>
            </p>

            <div className="flex gap-4 justify-center text-[13px] font-semibold text-[#52525b] mt-6 border-t border-[#27272a] pt-4">
                <p>Secured by TruthHire</p>
            </div>
        </div>
      </div>

      {/* --- OTP MODAL --- */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#27272a] rounded-xl p-6 w-full max-w-[500px] shadow-2xl relative">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-3 right-3 text-[#71717a] hover:text-white transition-colors">
                <X className="w-3.5 h-3.5"/>
            </button>
            
            <div className="text-center mb-5">
              <div className="w-10 h-10 bg-[#27272a] rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#3f3f46]">
                <Mail className="text-white w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-white mb-1">Check your email</h2>
              <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                We sent a code to <span className="text-white font-medium">{formData.email}</span>
              </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/10 p-2 rounded-lg mb-4 text-center">
                    <span className="text-red-400 text-[11px] font-medium">{error}</span>
                </div>
            )}

            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-9 h-11 text-center text-lg font-bold bg-[#09090b] border border-[#27272a] focus:border-blue-600 rounded-lg text-white outline-none transition-all placeholder-[#3f3f46]"
                  placeholder="-"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={verifying}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-9 rounded-lg transition-all text-xs disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Verify Code'}
            </button>

            <p className="text-center text-[10px] text-[#71717a] mt-4">
              No code? <button className="text-blue-500 hover:text-blue-400 font-medium hover:underline transition-colors">Resend</button>
            </p>
          </div>
        </div>
      )}

      {/* --- NEW SUCCESS MODAL (Professional Popup) --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-[#131316] border border-[#27272a] rounded-2xl p-8 w-full max-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            
            {/* Animated Success Icon */}
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-5 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <Check className="text-green-500 w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">
              {successMessage} <br/> Redirecting...
            </p>

            {/* Dynamic Loading Indicator Bar */}
            <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-[1500ms] ease-in-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}