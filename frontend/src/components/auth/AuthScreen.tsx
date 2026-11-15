import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Layers3, LoaderCircle, LockKeyhole, Mail, UserRound, Zap } from '../../lib/icons';
import { api } from '../../lib/api';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'sign-up') await api.signUp(email.trim(), password, name.trim());
      else await api.signIn(email.trim(), password);
      const session = await api.currentUser();
      if (!session?.user) throw new Error('Your account was created, but we could not start a session. Please sign in.');
      onAuthenticated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-40 -top-48 h-130 w-130 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-56 -right-32 h-140 w-140 rounded-full bg-indigo-500/10 blur-[130px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d0f14]/90 shadow-[0_35px_120px_rgba(0,0,0,0.55)] md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-white/5 bg-linear-to-br from-blue-500/10 via-transparent to-indigo-500/5 p-10 md:flex lg:p-14">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/50"><Zap className="h-5 w-5 fill-current" /></span>
            <div><div className="text-lg font-semibold tracking-tight">Atlaso</div><div className="text-xs text-slate-500">Engineering IDE for System Design</div></div>
          </div>

          <div className="max-w-md py-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-3 py-1.5 text-xs text-blue-200"><Layers3 className="h-3.5 w-3.5" /> Design systems with clarity</div>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-white lg:text-5xl">Build the architecture behind your next big idea.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">Map engineering primitives, explore trade-offs, and keep your system design work in one focused workspace.</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500"><div className="flex -space-x-2"><span className="h-7 w-7 rounded-full border-2 border-[#0d0f14] bg-blue-700" /><span className="h-7 w-7 rounded-full border-2 border-[#0d0f14] bg-violet-700" /><span className="h-7 w-7 rounded-full border-2 border-[#0d0f14] bg-emerald-700" /></div><span>Your engineering workspace starts here</span></div>
        </section>

        <section className="p-7 sm:p-10 lg:p-14">
          <div className="mb-9 flex items-center gap-3 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600"><Zap className="h-4 w-4 fill-current" /></span>
            <span className="font-semibold">Atlaso</span>
          </div>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Welcome to Atlaso</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{mode === 'sign-in' ? 'Sign in to your account' : 'Create your account'}</h2>
            <p className="mt-2 text-sm text-slate-400">{mode === 'sign-in' ? 'Pick up where your system design left off.' : 'Set up your workspace and start designing.'}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'sign-up' && <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">Full name</span><span className="relative block"><UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10" /></span></label>}

            <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">Email address</span><span className="relative block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10" /></span></label>

            <label className="block"><span className="mb-2 block text-xs font-medium text-slate-300">Password</span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required minLength={8} maxLength={128} placeholder="At least 8 characters" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>

            {error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm leading-5 text-red-300">{error}</div>}

            <button type="submit" disabled={busy} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <>{mode === 'sign-in' ? 'Sign in' : 'Create account'}<ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">{mode === 'sign-in' ? 'New to Atlaso?' : 'Already have an account?'}{' '}<button onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); }} className="font-medium text-blue-400 transition hover:text-blue-300">{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</button></p>
          <p className="mt-8 text-center text-[11px] leading-5 text-slate-600">By continuing, you agree to use Atlaso in line with your organization’s policies.</p>
        </section>
      </div>
    </main>
  );
}
