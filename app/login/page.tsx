'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      router.push('/account');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-zinc-950 px-4 py-16 text-white">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl md:grid-cols-[1fr_1.1fr]">
        <div className="hidden bg-zinc-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Member access</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight">Good products are better when they know where to find you.</h1>
          </div>
          <p className="max-w-xs text-sm leading-6 text-zinc-400">Sign in to keep your details ready for your next order.</p>
        </div>

        <div className="p-7 sm:p-12">
          <p className="text-sm font-medium text-zinc-500">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold">Sign in to your account</h2>
          <p className="mt-3 text-sm text-zinc-500">Use your Shopify customer account credentials.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-zinc-700">
              Email address
              <span className="relative mt-2 block">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-zinc-300 py-3 pl-10 pr-3 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-zinc-700">
              Password
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-zinc-300 py-3 pl-10 pr-3 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </span>
            </label>

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-3 font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            New here? <Link href="/register" className="font-semibold text-zinc-900 hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}