import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegistering) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        setError("Invalid email or password.");
      } else if (msg.includes("user-not-found")) {
        setError("No account found with that email.");
      } else if (msg.includes("email-already-in-use")) {
        setError("An account with that email already exists.");
      } else if (msg.includes("weak-password")) {
        setError("Password should be at least 6 characters.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(msg);
      }
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setIsRegistering(!isRegistering);
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1a1f2e]">
      <div className="flex flex-col items-center gap-6 animate-slide-up">
        {/* Logo */}
        <div className="w-28 h-28 flex items-center justify-center">
          <img
            src="/ns.svg"
            alt="N.S. Studio"
            className="w-full h-full object-contain drop-shadow-2xl"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        <div className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Novel Writing Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 font-light tracking-wide">
            {isRegistering
              ? "Create an account to sync your novels"
              : "Sign in to sync your novels across devices"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-72 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#2d3650] border border-[#3d4660] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all disabled:opacity-50"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#2d3650] border border-[#3d4660] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all disabled:opacity-50"
          />

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-400/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isRegistering ? "Creating account…" : "Signing in…"}
              </span>
            ) : isRegistering ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>

          <button
            type="button"
            onClick={toggleMode}
            disabled={submitting}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] text-gray-600 tracking-widest uppercase">
          N.S. Studio
        </p>
      </div>
    </div>
  );
}