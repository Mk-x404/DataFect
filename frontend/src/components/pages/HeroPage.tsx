import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  BarChart3,
  ShieldAlert,
  Brain,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Lock,
  ChevronRight,
  Upload,
  Copy,
  Check,
  ArrowRight,
  Database,
  Mail
} from 'lucide-react';

interface HeroPageProps {
  onStart: () => void;
  reducedMotion?: boolean;
}

// ── Easing Curves (Emil Kowalski / Design Engineering Standards)
// Skill: web-animation-design — use expo/quart for entering elements
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
const EASE_SPRING = { type: 'spring', stiffness: 420, damping: 26 } as const;

// ── Motion Variants
// Skill: motion-framer — variants for stagger + orchestration
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: EASE_OUT_EXPO, delay }
  })
};

const sectionFadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

// ── Staggered Headline Animation Variants
const headlineStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.1
    }
  }
};

const wordVariant: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE_OUT_EXPO }
  }
};

// ── Live Stream Ticker Dataset
const STREAM_ROWS = [
  { col: 'Yearly_Amount_Spent', val: '$481.24', status: 'normal', z: -0.3 },
  { col: 'Length_of_Membership', val: '3.8 yrs', status: 'normal', z: 1.2 },
  { col: 'Avg_Session_Length', val: '31.9 min', status: 'outlier', z: 3.1 },
  { col: 'Time_on_App', val: '11.4 min', status: 'normal', z: 0.7 },
  { col: 'Time_on_Website', val: '37.2 min', status: 'normal', z: -0.2 },
  { col: 'Num_Orders', val: '44', status: 'missing', z: null },
  { col: 'Yearly_Amount_Spent', val: '$612.07', status: 'normal', z: 1.4 },
  { col: 'Length_of_Membership', val: '5.1 yrs', status: 'normal', z: 1.9 },
];

// ── Feature Importances
const FEATURES = [
  { name: 'Length of Membership', pct: 61, color: 'var(--color-brand-lake)' },
  { name: 'Time on App', pct: 24, color: 'var(--color-brand-lake-deep)' },
  { name: 'Avg. Session Length', pct: 11, color: 'var(--color-ink-soft)' },
  { name: 'Time on Website', pct: 4, color: 'var(--color-mid-gray)' },
];

// ── Histogram (Normal Bell Distribution)
const HIST = [
  { val: 12, label: '$320-$380', count: 18 },
  { val: 28, label: '$380-$440', count: 42 },
  { val: 51, label: '$440-$480', count: 76 },
  { val: 82, label: '$480-$520', count: 124 },
  { val: 100, label: '$520-$560', count: 152 },
  { val: 86, label: '$560-$600', count: 130 },
  { val: 57, label: '$600-$640', count: 86 },
  { val: 30, label: '$640-$680', count: 45 },
  { val: 14, label: '$680-$720', count: 21 },
  { val: 6, label: '$720-$780', count: 9 },
];

// ── Live Stat Metrics
const STATS = [
  { label: 'Mean', value: '$499.31', mono: true, tip: 'Center' },
  { label: 'Skewness', value: '0.027', mono: true, tip: 'Symmetric' },
  { label: 'Kurtosis', value: '-0.11', mono: true, tip: 'Mesokurtic' },
  { label: 'Distribution', value: 'Gaussian ✓', mono: false, accent: true, tip: 'Passed Shapiro-Wilk' },
];

// ── Headline Words Configuration
const HEADLINE_WORDS = [
  { text: 'From', accent: false },
  { text: 'Data', accent: false },
  { text: 'Chaos', accent: false },
  { text: 'to', accent: false },
  { text: 'Clear', accent: true },
  { text: 'Decisions.', accent: true },
];

// ══════════════════════════════════════════════════════════
// SKILL: frontend-3d-scroll + modern-web-design
// DataFect Background Component — Animated SVG Mesh Grid
// + CSS-only data-flow particle streams
// Golden rule (web-animation-design): only animate
// transform + opacity. Zero layout-triggering props.
// ══════════════════════════════════════════════════════════
function DataFectHeroBackground({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Skill: frontend-3d-scroll — canvas particle system for depth
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Particle config — DataFect brand lake blue
    const LAKE = { r: 2, g: 132, b: 199 };
    const LAKE_DEEP = { r: 3, g: 105, b: 161 };

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; opacity: number;
      color: typeof LAKE;
      life: number; maxLife: number;
    }

    const particles: Particle[] = [];
    const NODE_COUNT = 55;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const spawnParticle = (): Particle => {
      const W = canvas.getBoundingClientRect().width;
      const H = canvas.getBoundingClientRect().height;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: Math.random() * 1.8 + 0.6,
        opacity: Math.random() * 0.45 + 0.08,
        color: Math.random() > 0.6 ? LAKE_DEEP : LAKE,
        life: 0,
        maxLife: Math.random() * 400 + 200,
      };
    };

    for (let i = 0; i < NODE_COUNT; i++) particles.push(spawnParticle());

    const CONNECTION_DIST = 110;
    let t = 0;

    const draw = () => {
      const W = canvas.getBoundingClientRect().width;
      const H = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, W, H);
      t += 0.004;

      const mx = mouseRef.current.x * W;
      const my = mouseRef.current.y * H;

      // ── Update + draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Gentle mouse attraction — creates organic data-flow feel
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          p.vx += (dx / dist) * 0.008;
          p.vy += (dy / dist) * 0.008;
        }

        // Soft speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.6) { p.vx *= 0.6 / speed; p.vy *= 0.6 / speed; }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        // Life fade
        const lifePct = p.life / p.maxLife;
        const alpha = lifePct < 0.15
          ? (lifePct / 0.15) * p.opacity
          : lifePct > 0.8
            ? ((1 - lifePct) / 0.2) * p.opacity
            : p.opacity;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha})`;
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles[i] = spawnParticle();
        }
      }

      // ── Draw connections — neural network / data graph aesthetic
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(2,132,199,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Layer 1: Precision Dot Grid — DataFect structural identity
          Skill: modern-web-design — fine dot grid for data-tool aesthetic */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)`,
        backgroundSize: '28px 28px',
        // Fade grid at edges for spatial depth
        maskImage: 'radial-gradient(ellipse 92% 75% at 50% 0%, black 20%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(ellipse 92% 75% at 50% 0%, black 20%, transparent 90%)',
      }} />

      {/* ── Layer 2: Diagonal scan-lines — data pipeline aesthetic
          Skill: frontend-design — unexpected texture, not a plain gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 38px,
          rgba(2,132,199,0.025) 38px,
          rgba(2,132,199,0.025) 39px
        )`,
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 8%, black 0%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 8%, black 0%, transparent 85%)',
      }} />

      {/* ── Layer 3: Live neural-net particle canvas
          Skill: frontend-3d-scroll — canvas for GPU-composited particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: reducedMotion ? 0 : 1,
          // Fade bottom half — particles don't compete with content
          maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 88%)',
          transition: 'opacity 0.6s ease',
        }}
      />

      {/* ── Layer 4: Primary Lake Blue radial aurora — branded depth
          Skill: impeccable — strong focal glow at top center */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(900px, 130vw)',
        height: '520px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(2,132,199,0.18) 0%, rgba(2,132,199,0.06) 45%, transparent 72%)',
        filter: 'blur(48px)',
        animation: reducedMotion ? 'none' : 'dfAuroraBreath 9s ease-in-out infinite',
      }} />

      {/* ── Layer 5: Secondary AI-indigo accent glow — off-center tension
          Skill: modern-web-design — asymmetry creates visual interest */}
      <div style={{
        position: 'absolute',
        top: '5%',
        right: '8%',
        width: '480px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(71,85,218,0.09) 0%, rgba(2,132,199,0.04) 55%, transparent 72%)',
        filter: 'blur(52px)',
        animation: reducedMotion ? 'none' : 'dfAccentDrift 12s ease-in-out infinite',
      }} />

      {/* ── Layer 6: Tertiary warm-cyan fill — prevents monochrome flatness */}
      <div style={{
        position: 'absolute',
        top: '2%',
        left: '5%',
        width: '420px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 68%)',
        filter: 'blur(60px)',
        animation: reducedMotion ? 'none' : 'dfWarmDrift 14s ease-in-out infinite 2s',
      }} />


      {/* ── Layer 8: Statistical data echo bars — ghost visualization
          Skill: frontend-design — echo of histogram in background creates brand coherence */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(700px, 90vw)',
        height: '120px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '6px',
        opacity: 0.07,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        {HIST.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: 'rgba(2,132,199,1)',
              borderRadius: '3px 3px 0 0',
              height: `${h.val}%`,
              animation: reducedMotion ? 'none' : `dfBarPulse ${3 + i * 0.3}s ease-in-out infinite ${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 9: Vignette for focus — content always wins
          Skill: impeccable — depth without distraction */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(255,255,255,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── CSS Keyframes injected via style tag */}
      <style>{`
        @keyframes dfAuroraBreath {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          33% { transform: translateX(-50%) scale(1.06) translateY(-12px); opacity: 0.85; }
          66% { transform: translateX(-50%) scale(0.96) translateY(8px); opacity: 0.95; }
        }
        @keyframes dfAccentDrift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          40% { transform: translate(-30px, 20px) scale(1.08); opacity: 0.75; }
          70% { transform: translate(20px, -15px) scale(0.94); opacity: 0.9; }
        }
        @keyframes dfWarmDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.1); }
        }
        @keyframes dfScanBeam {
          0% { top: 15%; opacity: 0; }
          8% { opacity: 1; }
          45% { opacity: 0.6; }
          55% { opacity: 0; }
          100% { top: 65%; opacity: 0; }
        }
        @keyframes dfBarPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes radarPing {
          0% { transform: scale(1); opacity: 0.8; }
          75%, 100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          25%, 100% { transform: translateX(200%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .df-animated { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}

function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function HeroPage({ onStart, reducedMotion = false }: HeroPageProps) {
  const [barsReady, setBarsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'quality' | 'automl'>('profile');
  const [streamIndex, setStreamIndex] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [latency, setLatency] = useState(412);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((_e: React.MouseEvent) => {
    // Parallax event handler
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  // Ticker loop with simulated jitter
  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => {
      setStreamIndex(i => (i + 1) % STREAM_ROWS.length);
      setLatency(400 + Math.floor(Math.random() * 38));
    }, 1400);
    return () => clearInterval(t);
  }, [reducedMotion]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("df = df.drop_duplicates()\ndf = df.dropna(subset=['Num_Orders'])");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pillars = [
    {
      icon: BarChart3,
      title: 'Statistical Profiler',
      sub: 'NIST Standard · Distributions & Outliers',
      copy: 'Instantly computes Tukey IQR fences, 10-bin histograms, skewness, kurtosis, and percentiles across every continuous and categorical column.',
      tag: 'Deterministic Engine',
      kpi: '100% Column Profiling',
      accentColor: 'var(--color-brand-lake)'
    },
    {
      icon: ShieldAlert,
      title: 'Quality Audit & Cleaner',
      sub: 'Heuristic Scoring & Pandas Fixes',
      copy: 'Detects missing values, duplicate records, high-cardinality flags, and anomalies with copy-paste ready Pandas remediation scripts.',
      tag: 'Heuristics Audit',
      kpi: '0–100 Health Score',
      accentColor: '#10b981'
    },
    {
      icon: Brain,
      title: 'AutoML Benchmark Lab',
      sub: 'Multi-Model Comparative Training',
      copy: 'Auto-selects optimal targets and benchmarks Random Forests, Gradient Boosters, and Linear Regressors with normalized feature importances and R² metrics.',
      tag: 'Scikit-Learn Core',
      kpi: 'Sub-500ms Train',
      accentColor: '#8b5cf6'
    },
    {
      icon: Sparkles,
      title: 'AI Storyboard & Assistant',
      sub: 'Grounded Statistical Synthesis',
      copy: 'Synthesizes executive narrative summaries and answers analytical questions grounded directly in pre-computed distributions, correlations, and data quality findings.',
      tag: 'Grounded Analysis',
      kpi: 'Profile-Grounded',
      accentColor: '#ec4899'
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '5.5rem',
        padding: '0 0 4rem',
        overflow: 'hidden'
      }}
    >
      {/* ══ SECTION 1: HERO HEADLINE & ACTIONS ══
          Skill: gsap-scrolltrigger philosophy — hero is the "Scene 1",
          everything else reveals on scroll. Full attention here.  */}
      <motion.section
        initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          zIndex: 1,
          // Skill: modern-web-design — isolate stacking context
          isolation: 'isolate',
          minHeight: 'clamp(480px, 72vh, 680px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* ══ EXCEPTIONAL DATAFECT BACKGROUND ══
            Skill: frontend-3d-scroll — canvas neural net particles
            Skill: frontend-design — 9-layer atmospheric depth system
            Skill: web-animation-design — only transform/opacity animated
            Skill: modern-web-design — glassmorphism + mesh grid identity
            Skill: impeccable — focus via vignette, data-echo bars
            Positioned to cover the full hero section only */}
        <DataFectHeroBackground reducedMotion={reducedMotion} />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '920px',
            margin: '0 auto',
            width: '100%',
            padding: 'clamp(3rem, 6vw, 5rem) 1.5rem 2rem',
          }}
        >
          {/* Eyebrow Badge with Live Dual-Ring Radar Beacon */}
          <motion.div variants={fadeUp} custom={0} style={{ marginBottom: '1.75rem' }}>
            <motion.div
              whileHover={reducedMotion ? {} : { scale: 1.025, y: -1 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              transition={EASE_SPRING}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '6px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(2, 132, 199, 0.28)',
                boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
                cursor: 'default'
              }}
            >
              <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand-lake)',
                  opacity: 0.75,
                  animation: reducedMotion ? 'none' : 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite'
                }} />
                <span style={{
                  position: 'relative',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand-lake)'
                }} />
              </span>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--color-brand-lake-deep)',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono, monospace)'
              }}>
                DataFect
              </span>
              <span style={{ color: 'var(--color-brand-lake-border)', userSelect: 'none' }}>·</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: 'var(--color-ink-soft)',
                fontFamily: 'var(--font-mono, monospace)'
              }}>
                Automated EDA &amp; AutoML Studio
              </span>
            </motion.div>
          </motion.div>

          {/* Staggered Editorial Headline
              Skill: web-animation-design — blur+fade word-by-word = "data resolving" metaphor */}
          <motion.h1
            variants={headlineStagger}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: 'var(--font-heading, "DM Serif Display", Georgia, serif)',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: 'var(--color-ink)',
              marginBottom: '1.25rem',
              maxWidth: '22ch',
              textWrap: 'balance'
            } as React.CSSProperties}
          >
            {HEADLINE_WORDS.map((w, idx) => (
              <motion.span
                key={w.text}
                variants={wordVariant}
                style={{
                  display: 'inline-block',
                  marginRight: idx === HEADLINE_WORDS.length - 1 ? 0 : '0.24em',
                  ...(w.accent ? {
                    fontStyle: 'italic',
                    color: 'var(--color-brand-lake)',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #0284c7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  } : {})
                }}
              >
                {w.text}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            custom={0.16}
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.05rem)',
              fontFamily: 'var(--font-sans, "Geist", system-ui)',
              color: 'var(--color-mid-gray)',
              lineHeight: 1.65,
              maxWidth: '56ch',
              marginBottom: '2.4rem',
              textWrap: 'pretty'
            } as React.CSSProperties}
          >
            Turn messy data into clear answers. DataFect cleans, explores, predicts,
            and tells the story — without the usual setup.
          </motion.p>

          {/* CTA Button
              Skill: web-animation-design — scale(1.035) on hover, scale(0.97) on tap
              Skill: impeccable — shimmer sweep is purposeful, not decorative */}
          <motion.div
            variants={fadeUp}
            custom={0.22}
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '2.5rem'
            }}
          >
            <motion.button
              onClick={onStart}
              whileHover={reducedMotion ? {} : {
                scale: 1.035,
                y: -3,
                boxShadow: '0 16px 36px -4px rgba(2, 132, 199, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.35) inset'
              }}
              whileTap={reducedMotion ? {} : { scale: 0.97 }}
              transition={EASE_SPRING}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '16px 36px',
                fontSize: '16px',
                fontWeight: 600,
                height: '54px',
                fontFamily: 'var(--font-sans, system-ui)',
                letterSpacing: '-0.01em',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-brand-lake)',
                color: '#ffffff',
                border: '1px solid var(--color-brand-lake-deep)',
                boxShadow: '0 8px 24px -2px rgba(2, 132, 199, 0.42), 0 1px 0 rgba(255,255,255,0.25) inset',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={15} strokeWidth={2.6} />
              </div>
              <span>Analyze a Dataset</span>
              <ArrowRight size={17} strokeWidth={2.4} style={{ marginLeft: '4px' }} />

              {/* Shimmer sweep — entrance-only, not looping on every hover */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                  transform: 'translateX(-100%)',
                  animation: reducedMotion ? 'none' : 'shimmerSweep 4.5s infinite'
                }}
              />
            </motion.button>
          </motion.div>

          {/* ── Live stats ticker below CTA — reinforces data velocity
              Skill: frontend-design — unexpected detail that rewards attention */}
          <motion.div
            variants={fadeUp}
            custom={0.32}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              { icon: Zap, label: `${latency}ms pipeline` },
              { icon: Activity, label: '12K+ rows/sec' },
              { icon: Lock, label: 'Zero storage' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                color: 'var(--color-mid-gray)',
                letterSpacing: '0.03em',
              }}>
                <Icon size={12} style={{ color: 'var(--color-brand-lake)' }} strokeWidth={2.5} />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══ SECTION 2: LIVE PRODUCT COCKPIT PREVIEW ══ */}
      <motion.section
        variants={sectionFadeUp}
        initial={reducedMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        style={{ position: 'relative', zIndex: 1, maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}
      >

        {/* Floating Accent Badge */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          style={{
            position: 'absolute',
            top: '-20px',
            right: '2.5rem',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.2)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-brand-lake-deep)',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          <Zap size={13} style={{ color: 'var(--color-brand-lake)', strokeWidth: 2.5 }} />
          <span>Pipeline Latency: {latency}ms</span>
        </motion.div>

        {/* Console Container Card */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }}
          style={{
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(2, 132, 199, 0.18)',
            boxShadow: '0 24px 60px -12px rgba(15, 16, 17, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
            overflow: 'hidden'
          }}
        >
          {/* Chrome Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: 'rgba(248, 249, 250, 0.9)',
            borderBottom: '1px solid var(--color-hairline)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ff5f56', border: '1px solid #e0443e', display: 'inline-block' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#ffbd2e', border: '1px solid #dea123', display: 'inline-block' }} />
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#27c93f', border: '1px solid #1aab29', display: 'inline-block' }} />
              <span style={{ marginLeft: '12px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-mid-gray)', fontWeight: 600 }}>
                DataFect Interactive Studio
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)' }} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                ecommerce_retail.csv · 500 rows · 7 cols
              </span>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Pill Tab Switcher */}
            <div style={{
              display: 'inline-flex',
              gap: '4px',
              padding: '4px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-paper)',
              border: '1px solid var(--color-hairline)',
              marginBottom: '1.25rem',
              position: 'relative'
            }}>
              {(['profile', 'quality', 'automl'] as const).map((tab) => {
                const labels: Record<string, string> = { profile: 'Statistical Profile', quality: 'Quality Audit', automl: 'AutoML Lab' };
                const icons: Record<string, typeof BarChart3> = { profile: BarChart3, quality: ShieldAlert, automl: Brain };
                const Icon = icons[tab];
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '8px 16px',
                      borderRadius: '9px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans, system-ui)',
                      fontSize: '13px',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#ffffff' : 'var(--color-mid-gray)',
                      backgroundColor: 'transparent',
                      zIndex: 1,
                      transition: 'color 0.18s ease'
                    }}
                  >
                    {active && (
                      <motion.div
                        layoutId="heroTabGlow"
                        transition={EASE_SPRING}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '9px',
                          backgroundColor: 'var(--color-ink)',
                          boxShadow: '0 2px 8px rgba(15, 16, 17, 0.25)',
                          zIndex: -1
                        }}
                      />
                    )}
                    <Icon size={14} strokeWidth={2.2} />
                    <span>{labels[tab]}</span>
                  </button>
                );
              })}
            </div>

            {/* Visual Cockpit Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="hero-viz-grid">

              {/* LEFT PANEL */}
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? {} : { opacity: 0, x: 10 }}
                    transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
                    className="blueprint-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '280px', padding: '1.25rem', borderRadius: '14px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'var(--color-brand-lake-subtle)', border: '1px solid var(--color-brand-lake-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-lake-deep)' }}>
                          <Activity size={16} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>Profiling Engine</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--color-brand-lake-deep)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>Target: Yearly_Amount_Spent (Float64)</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', backgroundColor: 'var(--color-brand-lake)', color: '#fff', fontFamily: 'var(--font-mono, monospace)', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}>R² 0.978</div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '92px', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '6px', paddingTop: '16px' }}>
                        {HIST.map((h, i) => {
                          const isHovered = hoveredBar === i;
                          return (
                            <div key={i} onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}>
                              <motion.div
                                initial={reducedMotion ? { height: `${h.val}%` } : { height: '0%' }}
                                animate={{ height: barsReady ? `${h.val}%` : '0%' }}
                                transition={{ duration: 0.65, delay: 0.04 * i, ease: EASE_OUT_EXPO }}
                                style={{ width: '100%', backgroundColor: isHovered ? 'var(--color-brand-lake-deep)' : i === 4 ? 'var(--color-brand-lake)' : i >= 3 && i <= 6 ? 'rgba(2, 132, 199, 0.5)' : 'var(--color-hairline)', borderRadius: '4px 4px 0 0', transition: 'background-color 0.18s ease' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <AnimatePresence>
                        {hoveredBar !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 2, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ position: 'absolute', top: '-8px', left: `${(hoveredBar / (HIST.length - 1)) * 80 + 10}%`, transform: 'translateX(-50%)', backgroundColor: 'var(--color-ink)', color: '#fff', padding: '4px 9px', borderRadius: '6px', fontSize: '10.5px', fontFamily: 'var(--font-mono, monospace)', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 10 }}
                          >
                            {HIST[hoveredBar].label}: <strong>{HIST[hoveredBar].count} rows</strong>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {STATS.map(s => (
                        <div key={s.label} style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--color-paper)' }}>
                          <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)' }}>{s.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: s.accent ? 'var(--color-brand-lake-deep)' : 'var(--color-ink)', fontFamily: s.mono ? 'var(--font-mono, monospace)' : 'var(--font-sans, system-ui)', marginTop: '2px' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[['Q1', '$444.25'], ['Median', '$498.65'], ['Q3', '$553.80'], ['Tukey Fence', '$720.08']].map(([k, v]) => (
                        <div key={k} style={{ flex: 1, padding: '7px 8px', backgroundColor: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                          <div style={{ fontSize: '9px', color: 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>{k}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'quality' && (
                  <motion.div
                    key="quality"
                    initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? {} : { opacity: 0, x: 10 }}
                    transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
                    className="blueprint-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '280px', padding: '1.25rem', borderRadius: '14px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                          <ShieldAlert size={16} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>Quality Health Audit</div>
                          <div style={{ fontSize: '10.5px', color: '#059669', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>Zero Critical Issues</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontFamily: 'var(--font-mono, monospace)' }}>96 / 100 HEALTHY</div>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--color-hairline)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <motion.div
                        initial={reducedMotion ? { width: '96%' } : { width: '0%' }}
                        animate={{ width: '96%' }}
                        transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
                        style={{ height: '100%', backgroundColor: '#10b981', borderRadius: '9999px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[{ label: 'Duplicate Rows', val: '0 (0.0%)', ok: true }, { label: 'Missing Values', val: '1 cell (0.2%)', ok: true }, { label: 'Constant Columns', val: '0 detected', ok: true }, { label: 'Outliers (IQR)', val: '14 rows flagged', ok: false }].map(({ label, val, ok }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-ink)' }}>{label}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: ok ? '#059669' : '#d97706' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ position: 'relative', padding: '10px 12px', backgroundColor: 'var(--color-obsidian, #0f1011)', borderRadius: '9px', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: '#a5f3fc', lineHeight: 1.6 }}>
                      <button onClick={handleCopyCode} style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: '5px', padding: '3px 7px', fontSize: '10px', cursor: 'pointer' }}>
                        {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                        {copiedCode ? 'Copied' : 'Copy'}
                      </button>
                      <span style={{ color: '#7dd3fc' }}>df</span> = df.drop_duplicates()<br />
                      <span style={{ color: '#7dd3fc' }}>df</span> = df.dropna(subset=[<span style={{ color: '#fca5a5' }}>'Num_Orders'</span>])
                    </div>
                  </motion.div>
                )}

                {activeTab === 'automl' && (
                  <motion.div
                    key="automl"
                    initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? {} : { opacity: 0, x: 10 }}
                    transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
                    className="blueprint-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '280px', padding: '1.25rem', borderRadius: '14px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                          <Cpu size={16} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>AutoML Benchmark</div>
                          <div style={{ fontSize: '10.5px', color: '#7c3aed', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>3 Algorithms Trained &amp; Evaluated</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontFamily: 'var(--font-mono, monospace)' }}>Linear Regressor WINNER</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {[{ name: 'Linear Regressor', r2: 0.978, rmse: 9.42, winner: true }, { name: 'Random Forest', r2: 0.961, rmse: 11.87, winner: false }, { name: 'Gradient Booster', r2: 0.954, rmse: 12.80, winner: false }].map(({ name, r2, rmse, winner }) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 11px', borderRadius: '8px', backgroundColor: winner ? 'var(--color-brand-lake-subtle)' : 'var(--color-paper)', border: `1px solid ${winner ? 'var(--color-brand-lake-border)' : 'var(--color-hairline)'}` }}>
                          <span style={{ fontSize: '12px', fontWeight: winner ? 700 : 500, color: winner ? 'var(--color-brand-lake-deep)' : 'var(--color-ink)' }}>{name}</span>
                          <div style={{ display: 'flex', gap: '14px' }}>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: winner ? 'var(--color-brand-lake-deep)' : 'var(--color-mid-gray)', fontWeight: 700 }}>R² {r2}</span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-mid-gray)' }}>RMSE {rmse}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                      <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)' }}>Top Feature Weights</div>
                      {FEATURES.map((f, i) => (
                        <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ minWidth: '135px', fontSize: '11px', color: 'var(--color-ink)', fontWeight: 500 }}>{f.name}</span>
                          <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--color-hairline)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <motion.div
                              initial={reducedMotion ? { width: `${f.pct}%` } : { width: '0%' }}
                              animate={{ width: barsReady ? `${f.pct}%` : '0%' }}
                              transition={{ duration: 0.75, delay: 0.08 * i, ease: EASE_OUT_EXPO }}
                              style={{ height: '100%', backgroundColor: f.color, borderRadius: '9999px' }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, minWidth: '32px', textAlign: 'right' }}>{f.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* RIGHT PANEL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Live Stream Ticker */}
                <div className="blueprint-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '1.25rem', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-brand-lake)', animation: reducedMotion ? 'none' : 'dotPulse 1.4s infinite' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-ink)' }}>Streaming Parsing Engine</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-brand-lake-deep)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>STREAM PARSER · 64KB BUFFER</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {STREAM_ROWS.slice(0, 4).map((row, i) => {
                      const isActive = i === streamIndex % 4;
                      return (
                        <motion.div
                          key={i}
                          animate={reducedMotion ? {} : { backgroundColor: isActive ? 'var(--color-brand-lake-subtle)' : 'transparent', borderColor: isActive ? 'var(--color-brand-lake-border)' : 'transparent', scale: isActive ? 1.01 : 1 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderRadius: '7px', border: '1px solid transparent' }}
                        >
                          <span style={{ fontSize: '11px', color: isActive ? 'var(--color-brand-lake-deep)' : 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)', fontWeight: isActive ? 600 : 400 }}>{row.col}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: row.status === 'outlier' ? '#f59e0b' : row.status === 'missing' ? '#ef4444' : 'var(--color-ink)' }}>{row.status === 'missing' ? 'NULL —' : row.val}</span>
                          <span style={{ marginLeft: '8px', fontSize: '9px', padding: '2px 7px', borderRadius: '9999px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, textTransform: 'uppercase', backgroundColor: row.status === 'outlier' ? '#fef3c7' : row.status === 'missing' ? '#fee2e2' : 'var(--color-brand-lake-subtle)', color: row.status === 'outlier' ? '#92400e' : row.status === 'missing' ? '#991b1b' : 'var(--color-brand-lake-deep)' }}>{row.status}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Storyboard */}
                <div className="blueprint-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '1.25rem', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '9px', backgroundColor: 'var(--color-brand-lake-subtle)', border: '1px solid var(--color-brand-lake-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-lake-deep)' }}>
                        <Sparkles size={15} strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>AI Executive Narrative Storyboard</span>
                    </div>
                    <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-brand-lake-subtle)', border: '1px solid var(--color-brand-lake-border)', color: 'var(--color-brand-lake-deep)', fontFamily: 'var(--font-mono, monospace)' }}>Executive Summary</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--color-ink)', lineHeight: 1.65, fontFamily: 'var(--font-sans, system-ui)', margin: 0, borderLeft: '2.5px solid var(--color-brand-lake)', paddingLeft: '12px' }}>
                    Length of Membership is the primary revenue driver with <strong style={{ color: 'var(--color-brand-lake-deep)' }}>R = 0.81</strong>. Customers retained past 2 years demonstrate <strong style={{ color: 'var(--color-brand-lake-deep)' }}>3.4x</strong> higher lifetime spend. Time on App provides strong secondary lift; website duration shows negligible correlation.
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    {['RETENTION', 'HIGH IMPACT', 'ACTIONABLE'].map(tag => (
                      <span key={tag} style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '9999px', backgroundColor: 'var(--color-brand-lake-subtle)', border: '1px solid var(--color-brand-lake-border)', color: 'var(--color-brand-lake-deep)', fontFamily: 'var(--font-mono, monospace)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ══ SECTION 3: FOUR ARCHITECTURAL ENGINES ══ */}
      <motion.section
        variants={sectionFadeUp}
        initial={reducedMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-brand-lake-deep)', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '6px' }}>Architectural Engines</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--color-ink)', fontFamily: 'var(--font-heading, "DM Serif Display", Georgia, serif)', lineHeight: 1.15, margin: 0 }}>Four engines. One instant pipeline.</h2>
          </div>
          <motion.button onClick={onStart} whileHover={reducedMotion ? {} : { x: 3, color: 'var(--color-brand-lake)' }} transition={EASE_SPRING} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-lake-deep)' }}>
            Launch full pipeline <ChevronRight size={15} strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const active = hoveredPillar === i;
            return (
              <motion.div
                key={p.title}
                initial={reducedMotion ? {} : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: EASE_OUT_EXPO }}
                onMouseEnter={() => setHoveredPillar(i)}
                onMouseLeave={() => setHoveredPillar(null)}
                whileHover={reducedMotion ? {} : { y: -5, boxShadow: '0 16px 36px -4px rgba(2, 132, 199, 0.16)' }}
                className="blueprint-card card-interactive"
                style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '1.4rem', borderRadius: '16px', cursor: 'pointer', transition: 'border-color 0.2s ease, box-shadow 0.2s ease', borderColor: active ? p.accentColor : undefined }}
                onClick={onStart}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <motion.div
                    animate={reducedMotion ? {} : { backgroundColor: active ? p.accentColor : 'var(--color-paper)', color: active ? '#ffffff' : p.accentColor, scale: active ? 1.06 : 1 }}
                    transition={{ duration: 0.18 }}
                    style={{ width: '42px', height: '42px', borderRadius: '11px', border: `1px solid ${active ? p.accentColor : 'var(--color-hairline)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </motion.div>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '9999px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-hairline)', color: p.accentColor, fontFamily: 'var(--font-mono, monospace)' }}>{p.tag}</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading, "DM Serif Display", Georgia, serif)', fontSize: '22px', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: '4px' }}>{p.title}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--color-mid-gray)', fontWeight: 500 }}>{p.sub}</div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-mid-gray)', lineHeight: 1.6, margin: 0 }}>{p.copy}</p>
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--color-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.07em', color: 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)' }}>CAPABILITY</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: p.accentColor, fontFamily: 'var(--font-mono, monospace)' }}>{p.kpi}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ══ SECTION 4: TRUST & BENCHMARK STRIP ══ */}
      <motion.section
        variants={sectionFadeUp}
        initial={reducedMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', padding: '28px 36px', borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.85)', border: '1px solid var(--color-hairline)', boxShadow: '0 4px 20px -2px rgba(15, 16, 17, 0.05)' }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-brand-lake-deep)', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '6px' }}>Production Architecture</div>
            <div style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.65rem)', fontWeight: 400, color: 'var(--color-ink)', fontFamily: 'var(--font-heading, "DM Serif Display", Georgia, serif)', letterSpacing: '-0.015em' }}>FastAPI · Scikit-Learn · Automated ML · React 19</div>
          </div>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {[{ val: '12,000+', label: 'Rows Ingested/sec' }, { val: '<500ms', label: 'Mean Pipeline Time' }, { val: '100%', label: 'Zero-Trust Memory' }].map(({ val, label }, i) => (
              <div key={label} style={{ display: 'flex', gap: '2.5rem' }}>
                {i > 0 && <div style={{ height: '36px', width: '1px', backgroundColor: 'var(--color-hairline)' }} />}
                <div>
                  <div style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', fontWeight: 400, color: 'var(--color-ink)', fontFamily: 'var(--font-heading, "DM Serif Display", Georgia, serif)', lineHeight: 1.1 }}>{val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '3px' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* ══ SECTION 5: FINAL CALL TO ACTION ══ */}
      <motion.section
        variants={sectionFadeUp}
        initial={reducedMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        style={{ maxWidth: '1160px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'clamp(3.5rem, 7vw, 5rem) 2rem', borderRadius: '20px', backgroundColor: 'var(--color-obsidian, #0f1011)', border: '1px solid rgba(2, 132, 199, 0.3)', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px -8px rgba(2, 132, 199, 0.28)' }}
        >
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '740px', height: '360px', background: 'radial-gradient(ellipse at center top, rgba(2, 132, 199, 0.38) 0%, rgba(2, 132, 199, 0.1) 50%, transparent 75%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-brand-lake-border)', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)', marginBottom: '1rem' }}>Instant Activation · Zero Configuration</div>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: '#ffffff', letterSpacing: '-0.025em', fontFamily: 'var(--font-heading, "DM Serif Display", Georgia, serif)', marginBottom: '1.2rem', lineHeight: 1.1, textWrap: 'balance' } as React.CSSProperties}>Ready to explore your dataset?</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.72)', maxWidth: '50ch', margin: '0 auto 2.25rem', lineHeight: 1.65 }}>Drop any CSV, JSON, or Excel file. Uncover distribution outliers, automated cleaning fixes, best-fit prediction models, and executive intelligence in under 500ms.</p>
            <motion.button
              onClick={onStart}
              whileHover={reducedMotion ? {} : { scale: 1.03, y: -2, boxShadow: '0 12px 32px rgba(2, 132, 199, 0.55)' }}
              whileTap={reducedMotion ? {} : { scale: 0.97 }}
              transition={EASE_SPRING}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', padding: '15px 36px', height: '52px', borderRadius: '9999px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--color-brand-lake)', color: '#ffffff', fontSize: '15px', fontWeight: 600, boxShadow: '0 4px 20px rgba(2, 132, 199, 0.45)' }}
            >
              <Upload size={16} strokeWidth={2.4} />
              <span>Start Instant Analysis</span>
              <ArrowRight size={15} strokeWidth={2.4} />
            </motion.button>
          </div>
        </motion.div>
      </motion.section>

      {/* ══ SECTION 6: FOOTER ══ */}
      <footer style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.82)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', color: 'var(--color-ink)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(2, 132, 199, 0.16)', boxShadow: '0 -10px 30px rgba(15, 23, 42, 0.03)' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 'min(1240px, 90%)', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(2, 132, 199, 0.25) 25%, #0284c7 50%, rgba(2, 132, 199, 0.25) 75%, transparent 100%)' }} />
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.25rem 2rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '1.75rem' }} className="hero-footer-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '480px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(2, 132, 199, 0.35)' }}>
                  <Database size={16} />
                </div>
                <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.025em' }}>DataFect</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-mid-gray)', lineHeight: 1.6, margin: 0 }}>Autonomous Exploratory Data Analysis, automated heuristic quality auditing, and Scikit-Learn multi-model predictive benchmarking. Converts raw tabular datasets into structured executive insights with zero configuration.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '2px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#059669', letterSpacing: '0.04em' }}>FASTAPI &amp; SCIKIT-LEARN ENGINE READY</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '320px', maxWidth: '480px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-brand-lake-deep)', textTransform: 'uppercase', fontFamily: 'var(--font-mono, monospace)' }}>Engineer · Get in Touch</div>
              <div style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(2, 132, 199, 0.18)', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)', flexShrink: 0 }}>M</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>Developed by <strong style={{ color: 'var(--color-brand-lake-deep)' }}>Muhib</strong></div>
                    <div style={{ fontSize: '11px', color: 'var(--color-mid-gray)', fontFamily: 'var(--font-mono, monospace)' }}>Lead Systems Architect &amp; Developer</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '10.5px', color: '#059669', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} /><span>Open to Inquiries</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { href: 'mailto:muhibk968@gmail.com', label: 'muhibk968@gmail.com', icon: <Mail size={13} style={{ color: 'var(--color-brand-lake)' }} />, hoverBg: 'var(--color-brand-lake-subtle)', hoverBorder: 'var(--color-brand-lake)', hoverColor: 'var(--color-brand-lake-deep)' },
                  { href: 'https://github.com/Mk-x404', label: 'GitHub', icon: <GithubIcon size={13} />, hoverBg: 'var(--color-ink)', hoverBorder: 'var(--color-ink)', hoverColor: '#ffffff' },
                  { href: 'https://www.linkedin.com/in/muhib-k73/', label: 'LinkedIn', icon: <LinkedinIcon size={13} />, hoverBg: '#0077b5', hoverBorder: '#0077b5', hoverColor: '#ffffff' },
                ].map(({ href, label, icon, hoverBg, hoverBorder, hoverColor }) => (
                  <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.85)', border: '1px solid var(--color-hairline)', color: 'var(--color-ink)', fontSize: '12px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.color = hoverColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.borderColor = 'var(--color-hairline)'; e.currentTarget.style.color = 'var(--color-ink)'; }}
                  >
                    {icon}<span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '12px', color: 'var(--color-mid-gray)' }}>
            <div>© 2026 DataFect Studio · Engineered by <strong style={{ color: 'var(--color-ink)' }}>Muhib</strong>.</div>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--color-mid-gray)' }}><Lock size={12} style={{ color: 'var(--color-brand-lake)' }} />Zero-Storage Session Privacy</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--color-mid-gray)' }}><Zap size={12} style={{ color: 'var(--color-brand-lake)' }} />Sub-500ms Statistical Profiling</span>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--color-hairline)', cursor: 'pointer', color: 'var(--color-brand-lake-deep)', fontWeight: 600, fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', transition: 'background 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-brand-lake-subtle)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'; }}>Back to Top ↑</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Responsive + Global Style Overrides
          Skill: modern-web-design — mobile-first breakpoints
          Skill: web-animation-design — reduced motion fallbacks */}
      <style>{`
        @media (max-width: 768px) {
          .hero-viz-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .hero-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 600px) {
          .hero-footer-grid { grid-template-columns: 1fr !important; gap: 2.25rem !important; }
        }
        /* Skill: web-animation-design — reduced motion compliance */
        @media (prefers-reduced-motion: reduce) {
          canvas { display: none !important; }
          [style*="animation"] { animation: none !important; }
          [style*="transition"] { transition: none !important; }
        }
      `}</style>
    </div>
  );
}