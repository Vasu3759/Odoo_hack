'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>AssetFlow</h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Log in to your account' : 'Register a new employee account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
              <input name="name" type="text" className="input-field" placeholder="e.g. Mitchell Admin" required={!isLogin} />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input name="email" type="email" className="input-field" placeholder="admin@yourcompany.com" required />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              {isLogin && <a href="#" className="text-xs text-[var(--color-secondary)] hover:underline">Reset Password</a>}
            </div>
            <input name="password" type="password" className="input-field" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log in' : 'Register')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm">
          <span className="text-gray-500">{isLogin ? "Don't have an account? " : "Already registered? "}</span>
          <button onClick={() => setIsLogin(!isLogin)} className="text-[var(--color-primary)] font-semibold hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
