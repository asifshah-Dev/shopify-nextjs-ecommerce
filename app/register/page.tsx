'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Unable to create your account.');
      setIsCreated(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-zinc-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-7 text-zinc-900 shadow-2xl sm:p-12">
        {isCreated ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
            <h1 className="mt-6 text-3xl font-bold">Account created</h1>
            <p className="mt-3 text-zinc-500">Your Shopify customer account is ready. Sign in to continue.</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-700"
            >
              Go to sign in <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-500">Join the store</p>
            <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
            <p className="mt-3 text-sm text-zinc-500">Save your details and track future orders.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700">
                  First name
                  <span className="relative mt-2 block">
                    <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required autoComplete="given-name" className="w-full rounded-lg border border-zinc-300 py-3 pl-10 pr-3 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />
                  </span>
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  Last name
                  <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required autoComplete="family-name" className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />
                </label>
              </div>

              <label className="block text-sm font-medium text-zinc-700">
                Email address
                <span className="relative mt-2 block">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                  <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required autoComplete="email" className="w-full rounded-lg border border-zinc-300 py-3 pl-10 pr-3 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />
                </span>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Password
                  <span className="relative mt-2 block">
                    <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required minLength={5} autoComplete="new-password" className="w-full rounded-lg border border-zinc-300 py-3 pl-10 pr-3 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />
                  </span>
                </label>
                <label className="block text-sm font-medium text-zinc-700">
                  Confirm password
                  <input type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} required minLength={5} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10" />
                </label>
              </div>

              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-3 font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? 'Creating account...' : 'Create account'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Already registered? <Link href="/login" className="font-semibold text-zinc-900 hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}