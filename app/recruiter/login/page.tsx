"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, CheckCircle2, X, Shield, AlertCircle, Clock } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function RecruiterLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // --- NEW: Success Modal States ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progress, setProgress] = useState(0);

  // Helper to handle the success transition
  const handleLoginSuccess = () => {
    setShowSuccessModal(true);
    // Start progress bar animation
    setTimeout(() => setProgress(100), 100);
    // Redirect after animation
    setTimeout(() => {
        router.push("/recruiter/dashboard");
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/recruiters/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.status === 403 && data.detail?.includes("pending verification")) {
        setShowPendingModal(true);
        setLoading(false);
        return;
      }
      
      if (!res.ok) throw new Error(data.detail || "Login failed");

      if (data.requires_otp) {
        toast.success("Verification code sent to your email!");
        setShowOtpModal(true);
        setLoading(false);
        return;
      }

      // Login Successful (Direct)
      localStorage.setItem("recruiter_token", data.access_token);
      localStorage.setItem("recruiter_id", data.recruiter_id);
      localStorage.setItem("recruiter_name", data.name);
      window.dispatchEvent(new Event("auth-change"));

      // Trigger Professional Modal instead of Toast
      handleLoginSuccess();
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false); // Only stop loading on error, keep loading on success for modal transition
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setError('');
    setVerifying(true);
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/recruiters/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpCode })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('recruiter_token', data.access_token);
        localStorage.setItem('recruiter_id', data.recruiter_id);
        localStorage.setItem('recruiter_name', data.name);
        window.dispatchEvent(new Event('auth-change'));
        
        // Close OTP modal and show Success Modal
        setShowOtpModal(false);
        handleLoginSuccess();
      } else {
        setError(data.detail || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
        setVerifying(false);
      }
    } catch (error) {
      setError('Verification failed');
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] p-4 font-sans text-white relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 bg-[#09090b]"></div>
      <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-[#09090b]/40 to-[#09090b] blur-[80px] pointer-events-none"></div>

      {/* --- MAIN CARD --- */}
      <div className="w-full max-w-[24rem] bg-[#131316] border border-[#27272a] rounded-xl p-6 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)] relative z-10 flex flex-col gap-5">
        
        {/* 1. Header */}
        <div className="text-center">
             <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2 hover:opacity-80 transition-opacity">
                <div className="bg-blue-600/10 p-1.5 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">TruthHire.</span>
             </Link>
             <h1 className="text-[16px] font-semibold text-white">Recruiter Login</h1>
             <p className="text-[#a1a1aa] text-[14px] mt-0.5">Welcome back! Please sign in to continue.</p>
        </div>

        {/* 2. Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          {error && !showOtpModal && (
            <div className="bg-red-500/10 border border-red-500/10 p-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-red-400 text-[11px] font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-[#f6f6f7] block ml-0.5">Work Email</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] w-3.5 h-3.5" />
                <input
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 rounded-lg pl-9 pr-3 h-9 text-[13px] text-white placeholder-[#3f3f46] outline-none transition-all"
                  placeholder="name@company.com"
                  required
                />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-0.5">
                <label className="text-[13px] font-medium text-[#f6f6f7]">Password</label>
                <Link href="#" className="text-[11px] text-blue-500 hover:text-blue-400">Forgot password?</Link>
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] w-3.5 h-3.5" />
                <input
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#09090b] border border-[#27272a] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 rounded-lg pl-9 pr-3 h-9 text-[13px] text-white placeholder-[#3f3f46] outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-9 rounded-lg transition-all mt-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_0_1px_rgba(37,99,235,1)] text-[13px]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>

        {/* 3. Footer Links */}
        <div className="text-center pt-2">
            <p className="text-[12px] text-[#71717a]">
                New to TruthHire?{' '}
                <Link href="/recruiter/register" className="text-blue-500 hover:text-blue-400 font-medium hover:underline">
                    Create account
                </Link>
            </p>

            <div className="flex gap-4 justify-center text-[12px] font-semibold text-[#52525b] mt-6 border-t border-[#27272a] pt-4">
                <p>Secured by TruthHire</p>
            </div>
        </div>
      </div>
      
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-[#27272a] rounded-xl p-6 w-full max-w-[340px] shadow-2xl relative">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-3 right-3 text-[#71717a] hover:text-white transition-colors">
                <X className="w-3.5 h-3.5"/>
            </button>
            
            <div className="text-center mb-5">
              <div className="w-10 h-10 bg-[#27272a] rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#3f3f46]">
                <Mail className="text-white w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-white mb-1">Verify Your Email</h2>
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
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
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
              {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Verify & Login'}
            </button>

            <p className="text-center text-[10px] text-[#71717a] mt-4">
              Didn't receive code? <button className="text-blue-500 hover:text-blue-400 font-medium hover:underline transition-colors">Resend</button>
            </p>
          </div>
        </div>
      )}

      {/* Pending Verification Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#131316] border border-yellow-500/20 rounded-xl p-6 w-full max-w-[30rem] shadow-2xl relative text-center">
            
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            
            <h2 className="text-[15px] font-bold text-white mb-2">Verification In Progress</h2>
            <p className="text-[13px] text-[#a1a1aa] mb-4 leading-relaxed">
                Your account is currently under review. We've sent you an email with more details.
            </p>
            
            <div className="bg-white/5 border border-white/5 rounded-lg p-3 mb-4 text-left">
                <div className="flex items-start gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[14px] text-gray-300 font-semibold">What's happening?</p>
                        <p className="text-[13px] text-gray-500">We are verifying your LinkedIn & company.</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[14px] text-gray-300 font-semibold">Duration</p>
                        <p className="text-[13px] text-gray-500">Usually 2-4 hours. Check email for updates.</p>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => setShowPendingModal(false)}
                className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white font-medium h-8 rounded-lg transition-all text-[14px] border border-[#3f3f46]"
            >
                Close
            </button>
          </div>
        </div>
      )}

      {/* --- NEW SUCCESS MODAL (Professional Popup) --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-[#131316] border border-[#27272a] rounded-2xl p-8 w-full max-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            
            {/* Animated Success Icon */}
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-5 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <CheckCircle2 className="text-green-500 w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-[#a1a1aa] text-sm mb-6 leading-relaxed">
              Verifying credentials... <br/> Redirecting to Dashboard.
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