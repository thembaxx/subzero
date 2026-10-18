"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Fingerprint,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  Menu,
  Plus,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Logo, TraceMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { AuthDialog } from "./AuthDialog";
import { InstallButton } from "./InstallButton";

const Sculpture = dynamic(() => import("./IdentitySculpture"), {
  ssr: false,
  loading: () => (
    <div className="identity-sculpture">
      <div className="sculpture-fallback">
        <TraceMark />
      </div>
    </div>
  ),
});

const features = [
  {
    icon: Globe2,
    title: "Find your forgotten corners.",
    summary: "The old sign-ups. The one-time purchases. The apps you’ve outgrown.",
    detail: "Connect your inbox or import an account list to bring the scattered pieces together.",
    visual: "accounts",
  },
  {
    icon: ScanLine,
    title: "See what’s out there.",
    summary: "Get a clearer picture of where your personal information may have been exposed.",
    detail: "Known breach records show what was involved, so you can decide what needs attention.",
    visual: "exposure",
  },
  {
    icon: KeyRound,
    title: "Make your next move.",
    summary: "A little knowledge. A little housekeeping. A lot more peace of mind.",
    detail: "Review possible accounts, visit each service, and take back control at your own pace.",
    visual: "control",
  },
];

const steps = [
  {
    title: "Start with a little hello.",
    text: "Your email address or phone number is the starting point. No passwords, and no searching for someone else.",
    icon: Mail,
    label: "Your identity",
    caption: "you@yourworld.com",
  },
  {
    title: "Make sure it’s really you.",
    text: "Open a magic link, enter a one-time phone code, or sign in with Google. Your footprint stays behind verified access.",
    icon: ShieldCheck,
    label: "Ownership verified",
    caption: "Only you can trace you.",
  },
  {
    title: "Connect your own dots.",
    text: "Choose a data source, review possible accounts, and understand the evidence. You decide what to connect and what to do next.",
    icon: Fingerprint,
    label: "Your digital footprint",
    caption: "A clearer picture starts here.",
  },
];

export function Landing() {
  const root = useRef<HTMLElement>(null);
  const [auth, setAuth] = useState(false);
  const [menu, setMenu] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [step, setStep] = useState(0);
  const [authNotice, setAuthNotice] = useState("");
  const StepIcon = steps[step].icon;
  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get("auth");
    if (state === "expired")
      setAuthNotice("That sign-in link has expired. Request a fresh link to continue.");
    if (state === "required") setAuth(true);
  }, []);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-copy > *", {
          y: 24,
          opacity: 0,
          duration: 0.9,
          stagger: 0.11,
          ease: "power3.out",
          clearProps: "all",
        });
        gsap.fromTo(
          ".hero-art",
          { opacity: 0, scale: 0.91 },
          { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" },
        );
        gsap.utils.toArray<HTMLElement>(".reveal-art").forEach((art) => {
          gsap.fromTo(
            art,
            { scale: 0.87, opacity: 0.7 },
            {
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: art, start: "top 95%", end: "top 35%", scrub: 1 },
            },
          );
          gsap.to(art, {
            opacity: 0.35,
            ease: "none",
            scrollTrigger: { trigger: art, start: "bottom 15%", end: "bottom top", scrub: 1 },
          });
        });
        gsap.fromTo(
          ".text-reveal span",
          { opacity: 0.22 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: {
              trigger: ".text-reveal",
              start: "top 85%",
              end: "bottom 50%",
              scrub: 1,
            },
          },
        );
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <main ref={root} className="landing">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header container">
        <Logo />
        <nav
          className={menu ? "header-nav mobile-open" : "header-nav"}
          aria-label="Main navigation"
        >
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#your-privacy" onClick={() => setMenu(false)}>
            Your privacy
          </a>
          <Link href="/dashboard?demo=1">
            Explore the demo
            <ArrowUpRight size={14} />
          </Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <button className="button button-dark header-cta" onClick={() => setAuth(true)}>
            Find my footprint
            <ArrowUpRight size={16} />
          </button>
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {authNotice && (
        <div className="auth-callback-notice container" role="alert">
          <span>{authNotice}</span>
          <button className="text-button" onClick={() => setAuth(true)}>
            Try again
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      <section className="hero container" id="main-content">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span />A little clarity. A lot more control.
          </div>
          <h1>
            You’re online.
            <br />
            Know <span className="heading-serif">where.</span>
          </h1>
          <p>
            From the accounts you forgot to the data you didn’t know was out there. Meet your
            digital footprint, and make it yours again.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => setAuth(true)}>
              Find my footprint
              <ArrowUpRight size={18} />
            </button>
            <Link className="button button-link" href="/dashboard?demo=1">
              Take a look first
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-note">
            <LockKeyhole size={14} />
            Your identity. Your eyes only.
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-coordinate coordinate-top">
            <span />A trace of you.
          </div>
          <Sculpture />
          <div className="art-label">
            <span className="art-label-icon">
              <ShieldCheck size={20} />
            </span>
            <div>
              <strong>Uniquely you.</strong>
              <span>Always in your hands.</span>
            </div>
            <span className="art-label-dot" />
          </div>
          <div className="art-coordinate coordinate-bottom">
            Less scattered. More connected.
            <Plus size={13} />
          </div>
        </div>
        <a href="#the-big-picture" className="hero-scroll" aria-label="Discover the bigger picture">
          <ArrowDown size={17} />
          <span>A clearer picture starts here</span>
        </a>
      </section>

      <section
        className="digital-world container"
        aria-label="Examples of services in your digital life"
      >
        <p>Your digital life has a lot of little corners.</p>
        <div className="brand-strip">
          <span className="brand-google">Google</span>
          <span className="brand-spotify">
            <span className="spotify-symbol">≋</span>Spotify
          </span>
          <span className="brand-notion">
            <b>N</b>Notion
          </span>
          <span className="brand-netflix">NETFLIX</span>
          <span className="brand-github">GitHub</span>
          <span className="brand-pinterest">pinterest</span>
        </div>
      </section>

      <section className="features-section section-space" id="the-big-picture">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bring it all into focus</span>
              <h2>
                Less digital clutter.
                <br />
                More room for{" "}
                <span className="inline-identity">
                  <TraceMark />
                </span>{" "}
                you.
              </h2>
            </div>
            <p>
              You’ve left little pieces of yourself across the internet. Let’s help you put the
              picture together.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`feature-card feature-${feature.visual}${activeFeature === index ? " feature-active" : ""}`}
              >
                <div
                  className={`feature-visual reveal-art ${feature.visual}-visual`}
                  aria-hidden="true"
                >
                  {index === 0 ? (
                    <div className="mini-account-cloud">
                      <span className="mini-service ms-google">G</span>
                      <span className="mini-service ms-spotify">≋</span>
                      <span className="mini-service ms-notion">N</span>
                      <span className="mini-service ms-figma">F</span>
                      <span className="mini-service ms-center">
                        <TraceMark />
                      </span>
                      <span className="cloud-line line-one" />
                      <span className="cloud-line line-two" />
                      <span className="cloud-line line-three" />
                      <span className="cloud-line line-four" />
                    </div>
                  ) : index === 1 ? (
                    <div className="exposure-preview">
                      <div className="exposure-preview-head">
                        <span className="mini-service mini-adobe">A</span>
                        <span>
                          <strong>A little heads-up</strong>
                          <small>Knowledge is a good first step.</small>
                        </span>
                      </div>
                      <div className="exposure-preview-line">
                        <span />
                        Email address
                        <Check size={13} />
                      </div>
                      <div className="exposure-preview-line">
                        <span />
                        Username
                        <Check size={13} />
                      </div>
                      <div className="exposure-check">
                        <ScanLine size={14} />
                        See the bigger picture
                      </div>
                    </div>
                  ) : (
                    <div className="control-preview">
                      <span className="control-orbit" />
                      <span className="control-orbit control-orbit-two" />
                      <div className="control-shield">
                        <ShieldCheck strokeWidth={1.3} size={49} />
                      </div>
                      <span className="control-pill">
                        <Check size={13} />A little more peace of mind
                      </span>
                    </div>
                  )}
                </div>
                <div className="feature-content">
                  <feature.icon size={21} strokeWidth={1.5} />
                  <h3>
                    <button
                      aria-expanded={activeFeature === index}
                      aria-controls={`feature-detail-${index}`}
                      onClick={() => setActiveFeature(activeFeature === index ? -1 : index)}
                    >
                      {feature.title}
                      <Plus size={17} />
                    </button>
                  </h3>
                  <p>{feature.summary}</p>
                  <div
                    className="feature-detail"
                    id={`feature-detail-${index}`}
                    hidden={activeFeature !== index}
                  >
                    <p>{feature.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section section-space container" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Simple by design</span>
            <h2>
              A few small steps.
              <br />A fresh perspective.
            </h2>
          </div>
          <p>
            No detective work required.
            <br />
            Just you, connecting your own dots.
          </p>
        </div>
        <div className="walkthrough">
          <div className={`walkthrough-art reveal-art walkthrough-step-${step}`}>
            <div className="walkthrough-grid" />
            <div className="walkthrough-orbit" />
            <div className="walkthrough-id" key={step}>
              <span className="walkthrough-id-icon">
                <StepIcon size={29} strokeWidth={1.5} />
              </span>
              <div>
                <small>{steps[step].label}</small>
                <strong>{steps[step].caption}</strong>
              </div>
              <span className="walkthrough-id-check">
                <Check size={16} />
              </span>
            </div>
            <span className="walkthrough-caption">A little less mystery.</span>
            <TraceMark className="walkthrough-watermark" />
          </div>
          <div className="walkthrough-content">
            <div className="step-indicators" aria-label="Walkthrough steps">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  className={index === step ? "active" : ""}
                  aria-label={`Step ${index + 1}: ${item.title}`}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => setStep(index)}
                />
              ))}
            </div>
            <div className="step-copy" key={step}>
              <span className="step-count">
                0{step + 1} <span>/ 03</span>
              </span>
              <h3>{steps[step].title}</h3>
              <p>{steps[step].text}</p>
            </div>
            <div className="walkthrough-controls">
              <button
                className="icon-button"
                aria-label="Previous step"
                onClick={() => setStep((step + 2) % 3)}
              >
                <ArrowLeft size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Next step"
                onClick={() => setStep((step + 1) % 3)}
              >
                <ArrowRight size={18} />
              </button>
              <button className="text-button" onClick={() => setAuth(true)}>
                Let’s get started
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="privacy-section section-space" id="your-privacy">
        <div className="container privacy-inner">
          <div className="privacy-icon">
            <LockKeyhole size={26} strokeWidth={1.4} />
          </div>
          <span className="eyebrow">Private. By nature.</span>
          <h2 className="text-reveal">
            {"Getting to know your digital self shouldn’t mean giving more of yourself away."
              .split(" ")
              .map((word, index) => (
                <span key={index}>{word} </span>
              ))}
          </h2>
          <div className="privacy-promises">
            <div>
              <ShieldCheck size={21} />
              <strong>Only you can trace you</strong>
              <p>Ownership is verified before any lookup. There’s no public people search.</p>
            </div>
            <div>
              <Fingerprint size={21} />
              <strong>You choose what connects</strong>
              <p>Inbox access is optional. Local imports stay in your browser.</p>
            </div>
            <div>
              <Sparkles size={21} />
              <strong>Clarity without the claims</strong>
              <p>See the source behind each result, and understand what it can tell you.</p>
            </div>
          </div>
          <Link className="text-button" href="/privacy">
            A closer look at your privacy
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <section className="final-cta container section-space">
        <div className="cta-line" />
        <TraceMark className="cta-mark" />
        <h2>
          A little more aware.
          <br />A lot more <span className="heading-serif">you.</span>
        </h2>
        <p>Your digital life is yours. Let’s bring it home.</p>
        <button className="button button-primary" onClick={() => setAuth(true)}>
          Find my footprint
          <ArrowUpRight size={18} />
        </button>
        <span className="cta-note">
          <LockKeyhole size={13} />
          Start with a verified email or phone number.
        </span>
      </section>

      <footer className="site-footer container">
        <div className="footer-top">
          <div>
            <Logo />
            <p>Leave less to wonder.</p>
          </div>
          <div className="footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <InstallButton />
            <ThemeToggle />
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Trace. A little clarity for your digital life.</span>
          <span>
            Made for your peace of mind
            <Plus size={12} />
          </span>
        </div>
      </footer>
      {auth && <AuthDialog onClose={() => setAuth(false)} />}
    </main>
  );
}
