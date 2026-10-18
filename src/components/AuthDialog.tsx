"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Smartphone,
} from "lucide-react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { Dialog } from "./Dialog";
import { CountrySelect } from "./CountrySelect";
import { TraceMark } from "./Logo";
import { getBrowserClient } from "@/lib/supabase/client";

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
      <path
        d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.8-2.4l-3.3-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.8v2.7A10.3 10.3 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.2 13.7a6.3 6.3 0 0 1 0-3.4V7.6H2.8a10.1 10.1 0 0 0 0 8.8l3.4-2.7Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10.3 10.3 0 0 0-9.2 5.6l3.4 2.7A6.1 6.1 0 0 1 12 6Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [stage, setStage] = useState<"entry" | "email-sent" | "otp">("entry");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<CountryCode>("US");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown < 1) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function client() {
    const value = getBrowserClient();
    if (!value)
      setError(
        "Sign-in is not configured on this deployment yet. You can explore the demo in the meantime.",
      );
    return value;
  }

  async function send(event?: React.SubmitEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    const supabase = client();
    if (!supabase) return;
    const parsed = method === "phone" ? parsePhoneNumberFromString(phone, country) : null;
    if (method === "phone" && !parsed?.isValid()) {
      setError("Enter a valid phone number for your selected country.");
      return;
    }
    setBusy(true);
    try {
      const result =
        method === "email"
          ? await supabase.auth.signInWithOtp({
              email: email.trim(),
              options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            })
          : await supabase.auth.signInWithOtp({ phone: parsed!.number });
      if (result.error) throw result.error;
      setDestination(method === "email" ? email.trim() : parsed!.number);
      setStage(method === "email" ? "email-sent" : "otp");
      setCooldown(45);
    } catch {
      setError(
        "We couldn’t send that sign-in request. Check your details and try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    try {
      const { error: verificationError } = await supabase.auth.verifyOtp({
        phone: destination,
        token: code,
        type: "sms",
      });
      if (verificationError) throw verificationError;
      router.push("/dashboard");
      router.refresh();
      onClose();
    } catch {
      setError("That code is invalid or has expired. Try again or request a new one.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    const supabase = client();
    if (!supabase) return;
    setBusy(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch {
      setError("Google sign-in is unavailable. Please try email or phone.");
      setBusy(false);
    }
  }

  return (
    <Dialog onClose={onClose} label="Sign in to Trace" className="auth-dialog">
      <div className="auth-symbol">
        <TraceMark />
      </div>
      <span className="eyebrow">A footprint that belongs to you</span>
      <h2>
        {stage === "email-sent"
          ? "A little hello in your inbox."
          : stage === "otp"
            ? "Let’s make sure it’s you."
            : "Your digital life, closer."}
      </h2>
      <p className="auth-intro">
        {stage === "entry"
          ? "Verify your identity to start connecting the dots. Only you can trace you."
          : stage === "email-sent"
            ? `A sign-in link has been requested for ${destination}. Open it in this browser to continue.`
            : `Enter the verification code sent to ${destination}.`}
      </p>
      {stage === "entry" ? (
        <>
          <button className="button button-outline google-button" onClick={google} disabled={busy}>
            <GoogleMark />
            Continue with Google
          </button>
          <div className="or-divider">
            <span>or keep it simple</span>
          </div>
          <div className="auth-tabs" aria-label="Sign-in method">
            <button
              className={method === "email" ? "active" : ""}
              aria-pressed={method === "email"}
              onClick={() => {
                setMethod("email");
                setError("");
              }}
            >
              <Mail size={16} />
              Email address
            </button>
            <button
              className={method === "phone" ? "active" : ""}
              aria-pressed={method === "phone"}
              onClick={() => {
                setMethod("phone");
                setError("");
              }}
            >
              <Smartphone size={16} />
              Phone number
            </button>
          </div>
          <form onSubmit={send} className="auth-form">
            {method === "email" ? (
              <>
                <label htmlFor="auth-email">Your email address</label>
                <input
                  id="auth-email"
                  autoComplete="email"
                  type="email"
                  placeholder="you@yourworld.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={254}
                />
              </>
            ) : (
              <>
                <label htmlFor="auth-phone">Your phone number</label>
                <div className="phone-field">
                  <CountrySelect value={country} onChange={setCountry} />
                  <input
                    id="auth-phone"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    maxLength={30}
                  />
                </div>
                <small>
                  Phone verification is supported. Discovery currently uses a connected inbox or a
                  local import.
                </small>
              </>
            )}
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {method === "email" ? "Send me a magic link" : "Send verification code"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="auth-sent">
          {stage === "email-sent" ? (
            <div className="mail-sent-icon">
              <Mail size={32} />
              <span>
                <Check size={13} />
              </span>
            </div>
          ) : (
            <form onSubmit={verify} className="auth-form">
              <label htmlFor="auth-code">Verification code</label>
              <input
                id="auth-code"
                className="otp-input"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                minLength={6}
                maxLength={8}
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                required
              />
              <button className="button button-primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <>
                    Verify and continue
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
          <button
            className="text-button resend-button"
            disabled={cooldown > 0 || busy}
            onClick={() => void send()}
          >
            {cooldown ? `Request again in ${cooldown}s` : "Send a new sign-in request"}
          </button>
          <button
            className="text-button"
            onClick={() => {
              setStage("entry");
              setError("");
              setCode("");
            }}
          >
            Use different details
          </button>
        </div>
      )}
      {error && (
        <div className="form-error" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}
      <div className="auth-privacy">
        <LockKeyhole size={14} />
        <span>No password to remember. No public searches.</span>
      </div>
      <p className="auth-terms">
        By continuing, you agree to our <Link href="/terms">Terms</Link> and{" "}
        <Link href="/privacy">Privacy policy</Link>.
      </p>
    </Dialog>
  );
}
