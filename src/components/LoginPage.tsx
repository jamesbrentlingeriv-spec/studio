import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoggingIn(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1a1f2e]">
      {/* Logo */}
      <div className="flex flex-col items-center gap-6 animate-slide-up">
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
            Sign in to sync your novels across devices
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleLogin}
          disabled={loggingIn}
          className="mt-6 flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loggingIn ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-2 max-w-xs text-center">
            {error}
          </p>
        )}
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