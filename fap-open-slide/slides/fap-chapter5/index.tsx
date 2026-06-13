import type { CSSProperties, ReactNode } from 'react';
import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useSlidePageNumber,
} from '@open-slide/core';

/* Fonts + keyframes injected once in <head> (every page mounts at once). */
if (typeof document !== 'undefined') {
  if (!document.getElementById('fap-webfont')) {
    const l = document.createElement('link');
    l.id = 'fap-webfont';
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;900&family=Heebo:wght@300;400;500;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400;1,8..60,500&display=swap';
    document.head.appendChild(l);
  }
  if (!document.getElementById('fap-kf')) {
    const s = document.createElement('style');
    s.id = 'fap-kf';
    s.textContent = `
@keyframes fapUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes fapDraw{to{stroke-dashoffset:0}}
@keyframes fapSpin{to{transform:rotate(360deg)}}
@keyframes fapFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes fapBreathe{0%,100%{transform:scale(1);opacity:.92}50%{transform:scale(1.07);opacity:1}}`;
    document.head.appendChild(s);
  }
}

/* Panel-tweakable design tokens (Paper & Ink). */
export const design: DesignSystem = {
  palette: { bg: '#f4eee1', text: '#211d17', accent: '#a8392b' },
  fonts: {
    display: '"Frank Ruhl Libre", serif',
    body: '"Heebo", sans-serif',
  },
  typeScale: { hero: 150, body: 32 },
  radius: 16,
};

/* Extended palette + fonts (outside the DesignSystem shape). */
const C = {
  paper: '#f4eee1',
  paper2: '#ece4d2',
  ink: '#211d17',
  inkSoft: '#5c5346',
  inkFaint: '#8a7f6e',
  crimson: '#a8392b',
  line: '#d3c8b2',
};
const F = {
  serif: '"Frank Ruhl Libre", serif',
  sans: '"Heebo", sans-serif',
  en: '"Source Serif 4", serif',
};
const EASE = 'cubic-bezier(.16,1,.3,1)';

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  direction: 'rtl',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
  overflow: 'hidden',
};

const PAPER_BG =
  'radial-gradient(circle at 90% 6%, rgba(168,57,43,.05), transparent 42%), #f4eee1';
const SCENE_BG =
  'radial-gradient(46% 60% at 16% 20%, rgba(224,169,67,.30), transparent 70%),' +
  'radial-gradient(48% 55% at 84% 26%, rgba(201,113,74,.24), transparent 72%),' +
  'radial-gradient(60% 66% at 74% 94%, rgba(168,57,43,.15), transparent 76%),' +
  'radial-gradient(40% 50% at 28% 88%, rgba(214,179,130,.34), transparent 72%),' +
  'linear-gradient(155deg,#f9f3e8 0%, #f0e7d5 55%, #e7dabf 100%)';
const GRAIN: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  opacity: 0.42,
  mixBlendMode: 'multiply',
  backgroundSize: '200px 200px',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
};

/* ── Shared primitives ────────────────────────────────────────── */
const Reveal = ({
  d = 0,
  children,
  style,
}: {
  d?: number;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div style={{ animation: `fapUp .8s ${EASE} both`, animationDelay: `${d}ms`, ...style }}>
    {children}
  </div>
);

const Orb = ({ s }: { s: CSSProperties }) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: '50%',
      filter: 'blur(50px)',
      opacity: 0.55,
      animation: 'fapFloat 9s ease-in-out infinite',
      ...s,
    }}
  />
);

const Paper = ({ children }: { children: ReactNode }) => (
  <div style={{ ...fill, background: PAPER_BG }}>{children}</div>
);

const Scene = ({ children }: { children: ReactNode }) => (
  <div style={{ ...fill, background: SCENE_BG }}>
    <div style={GRAIN} />
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 0, boxShadow: 'inset 0 0 280px rgba(58,38,26,.20)' }}
    />
    <Orb s={{ width: 380, height: 380, top: -70, left: '7%', background: 'radial-gradient(circle,rgba(224,169,67,.65),transparent 70%)' }} />
    <Orb s={{ width: 320, height: 320, bottom: -60, right: '11%', background: 'radial-gradient(circle,rgba(201,113,74,.55),transparent 70%)', animationDelay: '-4s' }} />
    <Orb s={{ width: 240, height: 240, top: '42%', right: '5%', background: 'radial-gradient(circle,rgba(168,57,43,.42),transparent 70%)', animationDelay: '-6.5s' }} />
    {children}
  </div>
);

const Pad = ({
  children,
  justify = 'flex-start',
  pad = '88px 132px',
}: {
  children: ReactNode;
  justify?: CSSProperties['justifyContent'];
  pad?: string;
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: justify,
      zIndex: 2,
    }}
  >
    {children}
  </div>
);

const Divider = ({ w = 170, mt = 0 }: { w?: number; mt?: number }) => (
  <div style={{ width: w, height: 5, background: C.crimson, borderRadius: 2, marginTop: mt }} />
);

const Crumb = ({ n, label, en }: { n: string; label: string; en?: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      fontFamily: F.sans,
      fontWeight: 500,
      fontSize: 23,
      letterSpacing: '.04em',
      color: C.inkSoft,
    }}
  >
    <span style={{ fontFamily: F.serif, fontWeight: 900, color: C.crimson, fontSize: 27 }}>{n}</span>
    <span style={{ width: 34, height: 2, background: C.line }} />
    <span>{label}</span>
    {en && (
      <>
        <span style={{ width: 34, height: 2, background: C.line }} />
        <span style={{ fontFamily: F.en, fontStyle: 'italic', color: C.inkFaint }}>{en}</span>
      </>
    )}
  </div>
);

const H2 = ({ children }: { children: ReactNode }) => (
  <h2
    style={{
      fontFamily: F.serif,
      fontWeight: 900,
      fontSize: 74,
      lineHeight: 1.02,
      letterSpacing: '-.01em',
      margin: '14px 0 0',
    }}
  >
    {children}
  </h2>
);

const Footer = ({ section }: { section: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        right: 132,
        left: 132,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: F.sans,
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: '.06em',
        color: C.inkFaint,
        zIndex: 3,
      }}
    >
      <span>
        <b style={{ color: C.crimson }}>FAP</b> Made Simple · פרק 5
      </span>
      <span>
        {section} · {String(current).padStart(2, '0')}/{String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const ulS: CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  margin: 0,
  padding: 0,
};
const Li = ({ children }: { children: ReactNode }) => (
  <li style={{ position: 'relative', paddingInlineStart: 42, fontSize: 27, lineHeight: 1.4, color: C.ink }}>
    <span
      style={{ position: 'absolute', insetInlineStart: 0, top: 13, width: 16, height: 16, background: C.crimson, borderRadius: '50%' }}
    />
    {children}
  </li>
);

const ColHead = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontFamily: F.serif,
      fontWeight: 700,
      fontSize: 34,
      color: C.crimson,
      marginBottom: 26,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}
  >
    {children}
    <span style={{ flex: 1, height: 2, background: C.line }} />
  </div>
);

const Card = ({
  tag,
  big,
  title,
  body,
}: {
  tag?: string;
  big?: string;
  title: string;
  body: ReactNode;
}) => (
  <div
    style={{
      background: C.paper2,
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: '36px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}
  >
    {big && (
      <span style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 60, color: C.crimson, lineHeight: 1 }}>
        {big}
      </span>
    )}
    {tag && (
      <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 21, letterSpacing: '.16em', textTransform: 'uppercase', color: C.crimson }}>
        {tag}
      </span>
    )}
    <h3 style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 36, lineHeight: 1.05, margin: 0 }}>{title}</h3>
    <p style={{ fontSize: 26, lineHeight: 1.45, color: C.inkSoft, margin: 0 }}>{body}</p>
  </div>
);

/* ── Rule rail + opener ───────────────────────────────────────── */
const RailStep = ({ n, label, on }: { n: string; label: string; on?: boolean }) => (
  <span
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 22px',
      border: `2px solid ${on ? C.crimson : C.line}`,
      borderRadius: 40,
      fontFamily: F.sans,
      fontWeight: 500,
      fontSize: 22,
      color: on ? C.ink : C.inkFaint,
      background: on ? C.paper2 : 'transparent',
    }}
  >
    <b style={{ fontFamily: F.serif, fontWeight: 900, color: on ? C.crimson : 'inherit' }}>{n}</b>
    {label}
  </span>
);
const Rail = ({ active }: { active: number }) => (
  <div style={{ display: 'flex', gap: 14, marginTop: 52 }}>
    <RailStep n="1" label="Notice" on={active === 1} />
    <RailStep n="2" label="Evoke" on={active === 2} />
    <RailStep n="3" label="Reinforce" on={active === 3} />
    <RailStep n="4" label="Effect" on={active === 4} />
    <RailStep n="5" label="Generalize" on={active === 5} />
  </div>
);

const stroke = { fill: 'none', stroke: C.crimson, strokeWidth: 3.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const strokeSoft = { fill: 'none', stroke: C.inkSoft, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const drawAnim: CSSProperties = { strokeDasharray: 760, strokeDashoffset: 760, animation: `fapDraw 1.5s ${EASE} .35s forwards` };

const EyeEmblem = () => (
  <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'fapFloat 6s ease-in-out infinite' }}>
      <path d="M36 150 Q150 64 264 150 Q150 236 36 150 Z" style={{ ...stroke, ...drawAnim }} />
      <circle cx="150" cy="150" r="34" style={stroke} />
      <circle cx="150" cy="150" r="13" fill={C.crimson} />
      <path d="M150 44 V18 M150 256 V282 M44 150 H18 M256 150 H282" style={strokeSoft} />
    </g>
  </svg>
);
const RippleEmblem = () => (
  <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
    <circle cx="150" cy="150" r="16" fill={C.crimson} />
    <circle cx="150" cy="150" r="42" style={stroke} />
    <circle cx="150" cy="150" r="30" style={strokeSoft}>
      <animate attributeName="r" values="30;130" dur="2.8s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.85;0" dur="2.8s" repeatCount="indefinite" />
    </circle>
    <circle cx="150" cy="150" r="30" style={strokeSoft}>
      <animate attributeName="r" values="30;130" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.85;0" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
    </circle>
  </svg>
);
const PulseEmblem = () => (
  <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'fapBreathe 3s ease-in-out infinite' }}>
      <circle cx="150" cy="150" r="96" style={strokeSoft} />
      <circle cx="150" cy="150" r="64" style={strokeSoft} />
      <circle cx="150" cy="150" r="32" style={stroke} />
      <circle cx="150" cy="150" r="15" fill={C.crimson} />
    </g>
  </svg>
);
const TrendEmblem = () => (
  <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
    <path d="M44 40 V258 H282" style={strokeSoft} />
    <path d="M58 232 C120 212 150 120 274 66" style={{ ...stroke, ...drawAnim }} />
    <path d="M58 96 C140 134 196 220 274 244" style={{ ...strokeSoft, strokeDasharray: '7 10' }} />
    <circle cx="274" cy="66" r="10" fill={C.crimson} />
    <circle cx="274" cy="244" r="9" fill={C.paper} style={stroke} />
  </svg>
);
const SpreadParticle = ({ cx, cy, begin }: { cx: number; cy: number; begin: string }) => (
  <circle r="7" fill={C.crimson}>
    <animate attributeName="cx" values={`150;${cx}`} dur="2.6s" begin={begin} repeatCount="indefinite" />
    <animate attributeName="cy" values={`150;${cy}`} dur="2.6s" begin={begin} repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0" dur="2.6s" begin={begin} repeatCount="indefinite" />
  </circle>
);
const SpreadEmblem = () => (
  <svg viewBox="0 0 300 300" width="300" height="300" aria-hidden="true">
    <circle cx="150" cy="150" r="120" style={{ ...strokeSoft, strokeDasharray: '5 13' }} />
    <circle cx="150" cy="150" r="44" style={stroke} />
    <circle cx="150" cy="150" r="14" fill={C.crimson} />
    <SpreadParticle cx={232} cy={72} begin="0s" />
    <SpreadParticle cx={232} cy={228} begin="0.65s" />
    <SpreadParticle cx={68} cy={228} begin="1.3s" />
    <SpreadParticle cx={68} cy={72} begin="1.95s" />
  </svg>
);

const RuleOpener = ({
  num,
  en,
  he,
  essence,
  active,
  Emblem,
}: {
  num: string;
  en: string;
  he: string;
  essence: string;
  active: number;
  Emblem: () => ReactNode;
}) => (
  <Scene>
    <div style={{ position: 'absolute', top: 150, left: 150, zIndex: 2 }}>
      <Emblem />
    </div>
    <Pad justify="center">
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 80, alignItems: 'center' }}>
        <Reveal style={{ position: 'relative', fontFamily: F.serif, fontWeight: 900, fontSize: 420, lineHeight: 0.8, color: C.crimson }}>
          {num}
          <span style={{ position: 'absolute', top: 30, right: -8, fontSize: 60, color: C.inkFaint, direction: 'ltr' }}>/5</span>
        </Reveal>
        <div>
          <Reveal d={120}>
            <p style={{ fontFamily: F.en, fontStyle: 'italic', fontSize: 52, color: C.inkSoft, direction: 'ltr', textAlign: 'right', margin: 0 }}>
              {en}
            </p>
            <h2 style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 118, lineHeight: 1, margin: '14px 0 26px' }}>{he}</h2>
            <Divider />
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: 36, lineHeight: 1.45, color: C.inkSoft, maxWidth: 880, marginTop: 24 }}>
              {essence}
            </p>
          </Reveal>
          <Reveal d={300}>
            <Rail active={active} />
          </Reveal>
        </div>
      </div>
    </Pad>
  </Scene>
);

/* ════════════════ PAGES ════════════════ */

const PTitle: Page = () => (
  <Scene>
    {/* connection motif: two presences, one thread */}
    <svg viewBox="0 0 230 230" width="230" height="230" style={{ position: 'absolute', top: 430, left: 150, zIndex: 2, opacity: 0.9 }} aria-hidden="true">
      <line x1="115" y1="46" x2="115" y2="184" style={strokeSoft} />
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'fapBreathe 4.5s ease-in-out infinite' }}>
        <circle cx="115" cy="46" r="15" fill={C.crimson} />
        <circle cx="115" cy="46" r="28" style={stroke} opacity={0.5} />
      </g>
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'fapBreathe 4.5s ease-in-out infinite', animationDelay: '-2.25s' }}>
        <circle cx="115" cy="184" r="15" fill={C.crimson} />
        <circle cx="115" cy="184" r="28" style={stroke} opacity={0.5} />
      </g>
    </svg>
    <Pad justify="space-between" pad="120px 140px">
      <Reveal>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${C.ink}`, paddingBottom: 26 }}>
          <span style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 26 }}>
            <b style={{ color: C.crimson }}>FAP</b> Made Simple · סדרת לימוד קלינית
          </span>
          <span style={{ fontFamily: F.en, fontStyle: 'italic', fontSize: 30, color: C.inkSoft }}>פרק חמישי</span>
        </div>
      </Reveal>
      <Reveal d={150}>
        <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 23, letterSpacing: '.4em', textTransform: 'uppercase', color: C.crimson }}>
          חמשת כללי ה־FAP
        </span>
        <h1 style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 150, lineHeight: 0.95, letterSpacing: '-.01em', margin: '28px 0 0' }}>
          עיצוב התהליך
          <span style={{ display: 'block', fontFamily: F.en, fontStyle: 'italic', fontWeight: 400, fontSize: 64, color: C.inkSoft, marginTop: 22, direction: 'ltr', textAlign: 'right', lineHeight: 1.05 }}>
            Shape Process with the Five Rules of FAP
          </span>
        </h1>
        <Divider mt={42} />
      </Reveal>
      <Reveal d={320}>
        <blockquote style={{ maxWidth: 1200, fontFamily: F.en, fontStyle: 'italic', fontSize: 34, lineHeight: 1.5, color: C.ink, direction: 'ltr', textAlign: 'left', margin: 0 }}>
          “It's easy to think it's about them, about him or her, but it's about you. And me. Connecting. Right now, in this conversation. Not that one. This one.”
          <cite style={{ display: 'block', marginTop: 16, fontStyle: 'normal', fontFamily: F.sans, fontWeight: 500, fontSize: 24, color: C.inkSoft, letterSpacing: '.04em' }}>
            — Susan Scott
          </cite>
        </blockquote>
      </Reveal>
    </Pad>
  </Scene>
);

const POpening: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="00" label="פתיח" />
        <H2>כשהבעיה מגיעה לחדר</H2>
        <Divider mt={18} />
      </Reveal>
      <div style={{ marginTop: 44 }}>
        <Reveal d={120}>
          <p style={{ fontFamily: F.sans, fontSize: 32, lineHeight: 1.55, color: C.inkSoft, maxWidth: 1500, margin: '0 0 40px' }}>
            הפרק נפתח בדיאלוג טיפולי: מטופלת מספרת על התגוננות בקשר עם בעלה — ובתוך השיחה עצמה, בחדר הטיפול, אותה דינמיקה מתרחשת שוב. כשהמאבק הבינאישי של המטופל מתרחש <b>בין המטפל למטופל</b>, נוצרות בו־זמנית אחריות והזדמנות.
          </p>
        </Reveal>
        <Reveal d={260}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            <Card tag="האחריות" title="לא לשחזר את הכאב" body="לא לחזור על מה שהמטופל כבר חווה — שהפגיעות מסוכנת, שעדיף להישאר מרוחק ומוגן." />
            <Card tag="ההזדמנות" title="חוויה רגשית מתקנת" body="ליצור, כאן ועכשיו, חוויה חדשה ומתקנת של קרבה, פגיעות ובטיחות." />
          </div>
        </Reveal>
      </div>
      <Footer section="עיצוב התהליך" />
    </Pad>
  </Paper>
);

const PCrb: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="00" label="מנגנון השינוי" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <H2>מהו CRB?</H2>
          <span style={{ fontFamily: F.en, fontStyle: 'italic', fontSize: 33, color: C.inkSoft, direction: 'ltr' }}>Clinically Relevant Behaviors</span>
        </div>
        <Divider mt={18} />
      </Reveal>
      <div style={{ marginTop: 46 }}>
        <Reveal d={140}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 30 }}>
            <Card big="CRB1" title="התנהגות בעייתית" body="הבעיה הקלינית שמופיעה בחדר — תגובות שעיקרן שייך לעולם שמחוץ לטיפול." />
            <Card big="CRB2" title="שיפור וצמיחה" body="התנהגויות אפקטיביות יותר, שליטה על CRB1 — מה שאנו רוצים להגביר." />
            <Card big="CRB3" title="תיאור והכללה" body="תיאורי המטופל את התנהגותו מחוץ לחדר, וההעברה של הנלמד אל החיים." />
          </div>
        </Reveal>
        <Reveal d={320}>
          <div style={{ background: C.paper2, borderInlineStart: `6px solid ${C.crimson}`, borderRadius: '0 14px 14px 0', padding: '32px 40px', marginTop: 38 }}>
            <p style={{ fontSize: 29, lineHeight: 1.5, color: C.ink, margin: 0 }}>
              <b style={{ color: C.crimson }}>המטרה:</b> להפחית CRB1 ולהגביר CRB2 דרך הקשר הטיפולי עצמו. הכללים הם כלי למידה — לא מרשם נוקשה. "נסה את זה — כנראה שדברים טובים יקרו."
            </p>
          </div>
        </Reveal>
      </div>
      <Footer section="מנגנון השינוי" />
    </Pad>
  </Paper>
);

const TblRow = ({ rn, en, ess, kw }: { rn: string; en: string; ess: string; kw: string }) => (
  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
    <td style={{ padding: '22px 28px', fontFamily: F.serif, fontWeight: 900, fontSize: 40, color: C.crimson, width: 120 }}>{rn}</td>
    <td style={{ padding: '22px 28px', fontFamily: F.en, fontStyle: 'italic', fontSize: 30, color: C.ink, whiteSpace: 'nowrap' }}>{en}</td>
    <td style={{ padding: '22px 28px', fontSize: 29, color: C.inkSoft }}>{ess}</td>
    <td style={{ padding: '22px 28px', fontFamily: F.sans, fontWeight: 700, fontSize: 29, color: C.ink, whiteSpace: 'nowrap' }}>{kw}</td>
  </tr>
);
const POverview: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="★" label="מבט־על" />
        <H2>חמשת הכללים במבט אחד</H2>
        <Divider mt={18} />
      </Reveal>
      <Reveal d={160} style={{ marginTop: 40 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
              {['כלל', 'שם', 'מהות', 'מילת מפתח'].map((h) => (
                <th key={h} style={{ textAlign: 'right', padding: '0 28px 18px', fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: '.14em', color: C.inkFaint }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TblRow rn="1" en="Notice CRB" ess="מודעות ואמפתיה לרגע הנוכחי" kw="שים לב" />
            <TblRow rn="2" en="Evoke CRB" ess="עידוד אסטרטגי, נועז ואמיתי" kw="עורר" />
            <TblRow rn="3" en="Reinforce CRB2" ess="חיזוק טבעי, אינטנסיבי ואותנטי" kw="חזק" />
            <TblRow rn="4" en="Notice Your Effect" ess="מעקב אחר ההתפתחות לאורך זמן" kw="שים לב להשפעתך" />
            <TblRow rn="5" en="Support Generalization" ess="העברה לחיים מחוץ לחדר הטיפול" kw="תמוך בהכללה" />
          </tbody>
        </table>
      </Reveal>
      <Footer section="מבט־על" />
    </Pad>
  </Paper>
);

const LegendRow = ({ n, he, en, p }: { n: string; he: string; en: string; p: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'baseline' }}>
    <span style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 40, color: C.crimson, lineHeight: 0.9, width: 48 }}>{n}</span>
    <div>
      <h4 style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 34, margin: 0 }}>
        {he} <span style={{ fontFamily: F.en, fontStyle: 'italic', fontSize: 24, color: C.inkFaint, direction: 'ltr' }}>{en}</span>
      </h4>
      <p style={{ fontSize: 24, color: C.inkSoft, lineHeight: 1.35, margin: '4px 0 0' }}>{p}</p>
    </div>
  </div>
);
const PCycle: Page = () => (
  <Scene>
    <Pad>
      <Reveal>
        <Crumb n="↻" label="מחזור התהליך" />
        <H2>תהליך מתמשך, רגע אחר רגע</H2>
        <Divider mt={18} />
      </Reveal>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '620px 1fr', gap: 70, alignItems: 'center', marginTop: 24 }}>
        <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="מחזור חמשת כללי FAP">
            <circle cx="300" cy="300" r="210" style={{ fill: 'none', stroke: C.line, strokeWidth: 3, strokeDasharray: '6 14', transformBox: 'fill-box', transformOrigin: 'center', animation: 'fapSpin 60s linear infinite' }} />
            <circle cx="300" cy="90" r="48" style={{ fill: C.paper2, stroke: C.crimson, strokeWidth: 3 }} />
            <text x="300" y="105" textAnchor="middle" style={{ fill: C.crimson, fontFamily: F.serif, fontWeight: 900, fontSize: 42 }}>1</text>
            <circle cx="500" cy="235" r="48" style={{ fill: C.paper2, stroke: C.crimson, strokeWidth: 3 }} />
            <text x="500" y="250" textAnchor="middle" style={{ fill: C.crimson, fontFamily: F.serif, fontWeight: 900, fontSize: 42 }}>2</text>
            <circle cx="423" cy="470" r="48" style={{ fill: C.paper2, stroke: C.crimson, strokeWidth: 3 }} />
            <text x="423" y="485" textAnchor="middle" style={{ fill: C.crimson, fontFamily: F.serif, fontWeight: 900, fontSize: 42 }}>3</text>
            <circle cx="177" cy="470" r="48" style={{ fill: C.paper2, stroke: C.crimson, strokeWidth: 3 }} />
            <text x="177" y="485" textAnchor="middle" style={{ fill: C.crimson, fontFamily: F.serif, fontWeight: 900, fontSize: 42 }}>4</text>
            <circle cx="100" cy="235" r="48" style={{ fill: C.paper2, stroke: C.crimson, strokeWidth: 3 }} />
            <text x="100" y="250" textAnchor="middle" style={{ fill: C.crimson, fontFamily: F.serif, fontWeight: 900, fontSize: 42 }}>5</text>
            <text x="300" y="292" textAnchor="middle" style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 48, fill: C.ink }}>FAP</text>
            <text x="300" y="332" textAnchor="middle" style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 23, fill: C.inkSoft, letterSpacing: '.12em' }}>כאן · ועכשיו</text>
            <g style={{ transformBox: 'view-box', transformOrigin: '300px 300px', animation: 'fapSpin 12s linear infinite' }}>
              <circle cx="300" cy="90" r="40" fill={C.crimson} opacity={0.22}>
                <animate attributeName="r" values="34;52;34" dur="1.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.28;0.05;0.28" dur="1.7s" repeatCount="indefinite" />
              </circle>
              <circle cx="300" cy="90" r="20" fill={C.crimson} />
            </g>
          </svg>
        </Reveal>
        <Reveal d={180} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <LegendRow n="1" he="שים לב" en="Notice" p="לראות את ה־CRB ברגע התרחשותו." />
          <LegendRow n="2" he="עורר" en="Evoke" p="ליצור את ההקשר שבו הוא מופיע." />
          <LegendRow n="3" he="חזק" en="Reinforce" p="לעצב את ה־CRB2 שצומח." />
          <LegendRow n="4" he="שים לב להשפעתך" en="Notice Effect" p="לעקוב אחר המגמה לאורך זמן." />
          <LegendRow n="5" he="תמוך בהכללה" en="Generalize" p="להעביר את הנלמד אל החיים." />
        </Reveal>
      </div>
      <Footer section="מחזור התהליך" />
    </Pad>
  </Scene>
);

/* Two-column examples + reflection layout */
const TwoCol = ({
  crumb,
  heading,
  leftHead,
  left,
  rightHead,
  right,
  section,
}: {
  crumb: ReactNode;
  heading: string;
  leftHead: string;
  left: ReactNode;
  rightHead: string;
  right: ReactNode;
  section: string;
}) => (
  <Paper>
    <Pad>
      <Reveal>
        {crumb}
        <H2>{heading}</H2>
        <Divider mt={18} />
      </Reveal>
      <div style={{ marginTop: 46, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <Reveal d={140}>
          <ColHead>{leftHead}</ColHead>
          <ul style={ulS}>{left}</ul>
        </Reveal>
        <Reveal d={260}>
          <ColHead>{rightHead}</ColHead>
          <ul style={ulS}>{right}</ul>
        </Reveal>
      </div>
      <Footer section={section} />
    </Pad>
  </Paper>
);

const PRule1Open: Page = () => (
  <RuleOpener num="1" en="Rule 1 · Notice CRB" he="שים לב" active={1} Emblem={EyeEmblem} essence="מודעות ואמפתיה לרגע הנוכחי — הבחנה בין מה שתקוע למה שצומח, בזמן אמת." />
);
const PRule1Essence: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="1" label="שים לב ל־CRB" en="Notice CRB" />
        <H2>מהות הכלל</H2>
        <Divider mt={18} />
      </Reveal>
      <div style={{ marginTop: 46, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <Reveal d={140}>
          <ColHead>הכלל החשוב ביותר</ColHead>
          <p style={{ fontFamily: F.sans, fontSize: 30, lineHeight: 1.5, color: C.inkSoft, margin: 0 }}>
            בוב קוהלנברג, אחד מיוצרי FAP, כינה זאת שנים רבות הכלל החשוב ביותר: כשמבינים אילו התנהגויות משרתות צמיחה ואילו מבטאות תקיעות — ממילא מגיבים בדרכים שמטפחות את האפקטיביות.
          </p>
          <ul style={{ ...ulS, marginTop: 30 }}>
            <Li>
              <b>מודעות</b> — מה מתעורר במטופל בטיפול וכיצד זה קשור לבעיה הקלינית.
            </Li>
            <Li>
              <b>אמפתיה</b> — רגישות לחוויה הפנימית: מי הוא רוצה להיות, וכמה קרוב לכך עכשיו.
            </Li>
          </ul>
        </Reveal>
        <Reveal d={260}>
          <ColHead>המשמעות הטכנית</ColHead>
          <p style={{ fontFamily: F.sans, fontSize: 30, lineHeight: 1.5, color: C.inkSoft, margin: 0 }}>
            הבחנה בין CRB1 ל־CRB2 בזמן אמת, והבנה כיצד הם מתעוררים ומעוצבים ברגע הנוכחי.
          </p>
          <div style={{ background: C.paper2, borderInlineStart: `6px solid ${C.crimson}`, borderRadius: '0 14px 14px 0', padding: '30px 38px', marginTop: 30 }}>
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: '.14em', textTransform: 'uppercase', color: C.crimson }}>הבסיס לכל השאר</span>
            <p style={{ fontSize: 27, lineHeight: 1.5, color: C.ink, margin: '12px 0 0' }}>
              ללא היכולת לראות את ה־CRB ברגע התרחשותו — ארבעת הכללים האחרים אינם יכולים לפעול.
            </p>
          </div>
        </Reveal>
      </div>
      <Footer section="כלל 1 · שים לב" />
    </Pad>
  </Paper>
);
const PRule1Ex: Page = () => (
  <TwoCol
    crumb={<Crumb n="1" label="שים לב ל־CRB" />}
    heading="לזהות את הרגע"
    section="כלל 1 · שים לב"
    leftHead="דוגמאות ל־CRB ברגע"
    left={
      <>
        <Li>מטופל אקומודטיבי מדי לגבי פגישות — אף שזה נוח, מתקשה לבטא צרכים.</Li>
        <Li>מטופל שנסגר ומגלה שפת גוף של בושה כשנוגעים בנושא מסוים.</Li>
        <Li>מטופל שקשריו מאופיינים בהימנעות — ונראה לא מעורב בפגישה.</Li>
        <Li>מטופל שמתקשה לבטא רגש בוכה בפגישה, ובפגישה הבאה נסוג.</Li>
        <Li>מטופל שעובר בין השקפות עצמיות סותרות ומתלונן שאיש לא מתקרב.</Li>
      </>
    }
    rightHead="שאלות להדרכה ולרפלקציה"
    right={
      <>
        <Li>מהם הדפוסים הבין־אישיים של המטופל בחיי היומיום?</Li>
        <Li>מה הדפוסים בתהליך שביניכם — ומהי נקודת הדמיון לחוץ?</Li>
        <Li>אילו התנהגויות שלך תורמות לדפוסים הללו?</Li>
        <Li>האם יש בקשר דפוסים מבלבלים, מעצבנים או מטרידים?</Li>
        <Li>אילו נקודות עיוורות שלך פוגמות בראיית CRBs?</Li>
      </>
    }
  />
);

const PRule2Open: Page = () => (
  <RuleOpener num="2" en="Rule 2 · Evoke CRB" he="עורר" active={2} Emblem={RippleEmblem} essence="לא רק לשים לב — ליצור באופן אסטרטגי את ההקשר שבו ה־CRB מתעורר. כוח משבש, חיובי וכן." />
);
const PRule2Essence: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="2" label="עורר CRB" en="Evoke CRB" />
        <H2>מהות הכלל</H2>
        <Divider mt={18} />
      </Reveal>
      <div style={{ marginTop: 40 }}>
        <Reveal d={120}>
          <p style={{ fontFamily: F.sans, fontSize: 32, lineHeight: 1.55, color: C.inkSoft, maxWidth: 1560, margin: '0 0 38px' }}>
            לאחר שהתכוונת ברגישות ואתה רואה את הפונקציה של מה שקורה — אפשר להיות אסטרטגי ומפורש ביצירת ההקשר שבו CRBs מתעוררים: לדבר ישירות על מה שקורה ביניכם, ועל האפשרות לתרגל תגובות אחרות, אפקטיביות יותר.
          </p>
        </Reveal>
        <Reveal d={260}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            <Card tag="הזהירות" title="טבעיות אמיתית — לא מניפולציה" body="אם ההקשר המעורר מרגיש מלאכותי, הוא חותר תחת בסיס הקשר. הכלל דורש אומץ: לעורר משהו חדש מחוץ לאזור הנוחות — של שניכם." />
            <Card tag="פונקציה כפולה" title="לתמוך לפחות כמו שמאתגרים" body="עידוד מעלה גם רגשות ותגובות נוספות. כשמעוררים CRB — האחריות היא להיות מכוון ורספונסיבי לרגע השלם." />
          </div>
        </Reveal>
      </div>
      <Footer section="כלל 2 · עורר" />
    </Pad>
  </Paper>
);
const PRule2Ex: Page = () => (
  <TwoCol
    crumb={<Crumb n="2" label="עורר CRB" />}
    heading="להזמין את החדש"
    section="כלל 2 · עורר"
    leftHead="דוגמאות לעידוד CRB"
    left={
      <>
        <Li>מתקשה לבטא צרכים — להזמין אותה לפתוח כל פגישה בהצהרת צרכים.</Li>
        <Li>פוחד מאינטימיות — לבקש לתרגל שיתוף במה שהוא נמנע ממנו.</Li>
        <Li>מתקשה לקבל אהבה — לבקש לשים לב לביטוי החם שלך בכניסתה.</Li>
        <Li>לספר על אובדן אישי — ולתת הזדמנות להגיב לרגשותיך, במיקוד במטרותיו.</Li>
      </>
    }
    rightHead="שאלות להדרכה ולרפלקציה"
    right={
      <>
        <Li>אילו מצבים, או התנהגויות שלך, מעוררים CRB מהמטופל?</Li>
        <Li>ממה אתה נמנע משום שה־CRB אי־נוח לך? האם זה אפקטיבי?</Li>
        <Li>האם לקחת אחריות על חלקך במחזורים המתפתחים?</Li>
        <Li>כשאתה מעורר — האם אתה רגיש לאיזון בין אומץ לאהבה?</Li>
        <Li>כיצד ההיסטוריה שלך משפיעה על האופן שבו אתה מאתגר?</Li>
      </>
    }
  />
);

const PRule3Open: Page = () => (
  <RuleOpener num="3" en="Rule 3 · Reinforce CRB2" he="חזק" active={3} Emblem={PulseEmblem} essence="לב ה־FAP. מנגנון השינוי הספציפי: לעצב CRB2 כך שיתמיד — דרך האופן שבו אתה מגיב ברגע שהוא קורה." />
);
const HowStep = ({ n, title, body }: { n: string; title: string; body: string }) => (
  <div style={{ background: C.paper2, border: `1px solid ${C.line}`, borderRadius: 14, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <span style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 44, color: C.crimson, lineHeight: 0.9 }}>{n}</span>
    <h4 style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 26, lineHeight: 1.12, margin: 0 }}>{title}</h4>
    <p style={{ fontSize: 20, lineHeight: 1.4, color: C.inkSoft, margin: 0 }}>{body}</p>
  </div>
);
const PRule3How: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="3" label="חזק CRB2" en="Reinforce CRB2" />
        <H2>כיצד לחזק — חמש הנחיות</H2>
        <Divider mt={18} />
      </Reveal>
      <Reveal d={120}>
        <p style={{ fontFamily: F.sans, fontSize: 31, lineHeight: 1.5, color: C.inkSoft, maxWidth: 1560, margin: '36px 0 0' }}>
          התאמה לפונקציה החיובית של קשר תומך עוצמתית יותר מעונש על CRB1. מה שחשוב הוא ההשלכות — כיצד אתה מגיב ברגע שה־CRB2 קורה.
        </p>
      </Reveal>
      <Reveal d={260} style={{ marginTop: 38 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 22 }}>
          <HowStep n="1" title="טבעי אך אינטנסיבי" body="זהה את תגובתך הטבעית והגבר אותה מעבר לנורמות הרגילות." />
          <HowStep n="2" title="בטיחות וקבלה" body="הבע בפירוש, באותנטיות, שהמטופל בטוח ומקובל עליך." />
          <HowStep n="3" title="דבר בביטחון" body="קול ברור וחזק — במיוחד ב־100% קבלה, לא בעמימות." />
          <HowStep n="4" title="למד לאדם" body="הפונקציה חשובה מהצורה: מה שמאמת אחד מבייש אחר." />
          <HowStep n="5" title="היה אמיתי" body="בני אדם מזהים זיוף. הבא את קולך — אל תעקוב אחרי תסריט." />
        </div>
      </Reveal>
      <Footer section="כלל 3 · חזק" />
    </Pad>
  </Paper>
);
const PRule3Ex: Page = () => (
  <TwoCol
    crumb={<Crumb n="3" label="חזק CRB2" />}
    heading="חיזוק בפועל"
    section="כלל 3 · חזק"
    leftHead="דוגמאות לחיזוק CRB2"
    left={
      <>
        <Li>הכרה בבקשה לזמן פגישה נוסף — על ידי מתן הזמן בפועל.</Li>
        <Li>שיתוף תגובה עמוקה לסיפור חייו וכמה היה מעורר השראה.</Li>
        <Li>"זה CRB2 מדהים שלך!" — תוך הושטת יד ל"high five".</Li>
        <Li>לומר שה־CRB2 שלו חידש בך את ההתלהבות מהעבודה.</Li>
        <Li>להצטרף לפגיעות שלה בכך שתשתף חוויה דומה משלך.</Li>
      </>
    }
    rightHead="שאלות להדרכה ולרפלקציה"
    right={
      <>
        <Li>האם אתה רואה את רגעי השיפור ומרגיש מעורב בשינוי?</Li>
        <Li>האם המטופל מודע לתגובותיך לפגיעות ולצמיחה שלו?</Li>
        <Li>האם אתה מגיב בדרכים פתוחות־לב שמרגישות אמיתיות?</Li>
        <Li>האם אתה מסתיר תגובה רגשית מאחורי פסיכואדוקציה?</Li>
        <Li>מה אתה מעריך ואוהב במטופל — והאם הודעת לו זאת?</Li>
      </>
    }
  />
);

const PRule4Open: Page = () => (
  <RuleOpener num="4" en="Rule 4 · Notice Your Effect" he="שים לב להשפעתך" active={4} Emblem={TrendEmblem} essence="חיזוק פועל לאורך זמן, לא מיידית. עקוב אחר המגמה: האם CRB2 עולה ו־CRB1 יורד?" />
);
const PRule4Body: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="4" label="שים לב להשפעתך" en="Notice Your Effect" />
        <H2>מה קורה לאורך זמן?</H2>
        <Divider mt={18} />
      </Reveal>
      <Reveal d={120}>
        <p style={{ fontFamily: F.sans, fontSize: 31, lineHeight: 1.5, color: C.inkSoft, maxWidth: 1560, margin: '36px 0 0' }}>
          חיזוק הוא תהליך שבו התנהגות עולה בתדירות לאורך זמן. כדי לדעת שאתה אכן מחזק CRB2, שים לב לא רק לתגובתך ברגע — אלא לאופן שבו ההתנהגות מתפתחת. <b>טעויות בלתי נמנעות; מה שמשנה הוא המגמה הכוללת.</b>
        </p>
      </Reveal>
      <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
        <Reveal d={220}>
          <ColHead>כלים מעשיים</ColHead>
          <ul style={ulS}>
            <Li>אחרי חילופי דברים אינטנסיביים — לברר כיצד חוותה את האינטראקציה.</Li>
            <Li>אם חוזר אותו דפוס — לשאול אם יש לו אותו רושם.</Li>
            <Li>אחרי ניסיון לספק בטיחות — לשאול אם הוא מרגיש בטוח יותר.</Li>
            <Li>בסוף כל פגישה: "כיצד הייתי בתגובה אליך היום?"</Li>
          </ul>
        </Reveal>
        <Reveal d={340}>
          <ColHead>שאלות להדרכה</ColHead>
          <ul style={ulS}>
            <Li>האם CRB2 עולה בחוזק ובתדירות — ו־CRB1 יורד?</Li>
            <Li>כשהמטופל בתקיעות — האם משהו שאתה עושה אינו מסייע?</Li>
            <Li>האם אתה בודק את השפעתך באופן קבוע, או מניח אותה?</Li>
            <Li>מה יכול לשפר את האופן שבו אתה מנטר את התהליך?</Li>
          </ul>
        </Reveal>
      </div>
      <Footer section="כלל 4 · שים לב להשפעתך" />
    </Pad>
  </Paper>
);

const PRule5Open: Page = () => (
  <RuleOpener num="5" en="Rule 5 · Support Generalization" he="תמוך בהכללה" active={5} Emblem={SpreadEmblem} essence="המטרה היא שינוי מחוץ לחדר — מתמשך מספיק כדי שהטיפול יוכל בסופו של דבר להסתיים." />
);
const PRule5Ways: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="5" label="תמוך בהכללה" en="Support Generalization" />
        <H2>מהחדר אל החיים — שתי דרכים</H2>
        <Divider mt={18} />
      </Reveal>
      <div style={{ marginTop: 44 }}>
        <Reveal d={140}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            <Card tag="דרך 1" title="מקבילות מבפנים־לחוץ" body={<span><i style={{ fontFamily: F.en }}>In-to-Out Parallels</i> — לקחת את מה שקרה זה עתה בפגישה ולהקביל אותו למצב שאכפת למטופל ממנו בחוץ.</span>} />
            <Card tag="דרך 2" title="שיעורי בית — תרגול עם אחרים" body="המטלות הטובות נובעות מיד מאינטראקציה עוצמתית. למשל: אחרי שחיזקנו קשר עין כ־CRB2 — לבקש להגביר אותו עם אחרים." />
          </div>
        </Reveal>
        <Reveal d={300}>
          <div style={{ background: C.paper2, borderInlineStart: `6px solid ${C.crimson}`, borderRadius: '0 14px 14px 0', padding: '30px 38px', marginTop: 36 }}>
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: '.14em', textTransform: 'uppercase', color: C.crimson }}>דוגמה למקבילה מבפנים־לחוץ</span>
            <p style={{ fontFamily: F.en, fontStyle: 'italic', fontSize: 28, lineHeight: 1.4, color: C.ink, direction: 'ltr', textAlign: 'left', margin: '12px 0 0' }}>
              “When you ask me for what you need, I give it to you. I think your partner wants that from you too — what do you think?”
            </p>
          </div>
        </Reveal>
      </div>
      <Footer section="כלל 5 · תמוך בהכללה" />
    </Pad>
  </Paper>
);
const PRule5Ex: Page = () => (
  <TwoCol
    crumb={<Crumb n="5" label="תמוך בהכללה" />}
    heading="לקדם הכללה"
    section="כלל 5 · תמוך בהכללה"
    leftHead="דוגמאות נוספות"
    left={
      <>
        <Li>לשתף את המטופל בניתוח הפונקציונלי ובזיהוי CRB1 ו־CRB2.</Li>
        <Li>לקבל פידבק: כמה רגעי פגישה דומים להקשרים בחוץ.</Li>
        <Li>להצביע כיצד מה שעשה בפגישה רלוונטי לקשריו.</Li>
        <Li>אחרי שזיהתה צורך — שיעורי בית להתחבר לצרכיה כל יום.</Li>
        <Li>לתזמן פעילות שמזמנת תרגול CRB2 — מיד לאחר שהופיע.</Li>
      </>
    }
    rightHead="שאלות להדרכה ולרפלקציה"
    right={
      <>
        <Li>האם המטופל מסכים שה־CRBs דומים פונקציונלית להתנהגויות בחוץ?</Li>
        <Li>אם לא — האם דנתם בנקודות המחלוקת?</Li>
        <Li>האם אתה דן בדרכים שבהן הוא לוקח את החוויה אל חייו?</Li>
        <Li>כמה טוב עובדת ההעברה לחיי היומיום? מה ישפר אותה?</Li>
      </>
    }
  />
);

const Turn = ({ rule, en, children }: { rule: string; en: string; children: ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 30, alignItems: 'start' }}>
    <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, color: C.crimson, paddingTop: 8, textAlign: 'left' }}>
      {rule}
      <small style={{ display: 'block', fontWeight: 500, fontSize: 18, color: C.inkFaint }}>{en}</small>
    </div>
    <div style={{ background: C.paper2, border: `1px solid ${C.line}`, borderRadius: 14, padding: '22px 30px', fontSize: 28, lineHeight: 1.42 }}>
      {children}
    </div>
  </div>
);
const PDialogue: Page = () => (
  <Paper>
    <Pad>
      <Reveal>
        <Crumb n="●" label="הדגמה" en="Case Example" />
        <H2>חמשת הכללים בפעולה</H2>
        <Divider mt={18} />
      </Reveal>
      <Reveal d={160} style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Turn rule="כלל 1" en="Notice">
          המטפל מזהה CRB שהתרחש קודם בפגישה — אותה התגוננות שהמטופלת תיארה בבית, מתרחשת עכשיו בחדר.
        </Turn>
        <Turn rule="כלל 2" en="Evoke">
          "מה <b style={{ color: C.crimson }}>יכולת לנסות ממש עכשיו</b> שייראה פחות הגנתי?" — הזמנה לתגובה חדשה ברגע.
        </Turn>
        <Turn rule="כלל 3" en="Reinforce">
          "זה <b style={{ color: C.crimson }}>מדהים</b> כמה שונה זה נשמע" — חיזוק אותנטי של רגע הפגיעות.
        </Turn>
        <Turn rule="כלל 5" en="Generalize">
          <span style={{ direction: 'ltr', textAlign: 'left', display: 'block' }}>
            "<b style={{ color: C.crimson }}>What if you could do this with her?</b>" — חיבור הרגע אל הקשר שמחוץ לחדר.
          </span>
        </Turn>
      </Reveal>
      <Footer section="הדגמה" />
    </Pad>
  </Paper>
);

const SumPt = ({ n, title, body, full }: { n: string; title: string; body: string; full?: boolean }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 26, alignItems: 'start', gridColumn: full ? '1 / -1' : undefined }}>
    <span style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 62, color: C.crimson, lineHeight: 0.9 }}>{n}</span>
    <div>
      <h4 style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 33, lineHeight: 1.1, margin: 0 }}>{title}</h4>
      <p style={{ fontSize: 25, lineHeight: 1.42, color: C.inkSoft, margin: '6px 0 0' }}>{body}</p>
    </div>
  </div>
);
const PSummary: Page = () => (
  <Scene>
    <Pad>
      <Reveal>
        <Crumb n="∑" label="סיכום" />
        <H2>FAP — לא סגנון, אלא תהליך</H2>
        <Divider mt={18} />
      </Reveal>
      <Reveal d={160} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px 70px' }}>
          <SumPt n="1" title="הכללים הם כלי למידה" body="לא מרשם נוקשה — מסגרת לחשיבה פונקציונלית רגע אחר רגע." />
          <SumPt n="2" title="כלל 1 הוא הבסיס" body="בלי מודעות ואמפתיה לרגע, שאר הכללים אינם יכולים לפעול." />
          <SumPt n="3" title="כלל 3 הוא הלב" body="חיזוק CRB2 הוא מנגנון השינוי הספציפי של FAP." />
          <SumPt n="4" title="האמינות היא הכלי" body="האותנטיות של המטפל היא הכלי העיקרי לשינוי." />
          <SumPt n="5" title="המטרה: שינוי מחוץ לחדר" body="הצלחת הטיפול נמדדת בחיים — לא בחדר בלבד." full />
        </div>
      </Reveal>
      <Footer section="סיכום" />
    </Pad>
  </Scene>
);

const PClosing: Page = () => (
  <Scene>
    <Pad justify="center">
      <Reveal>
        <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 23, letterSpacing: '.4em', textTransform: 'uppercase', color: C.crimson }}>לסיום</span>
      </Reveal>
      <Reveal d={150}>
        <blockquote style={{ fontFamily: F.en, fontStyle: 'italic', fontSize: 58, lineHeight: 1.34, color: C.ink, direction: 'ltr', textAlign: 'left', maxWidth: 1480, margin: '30px 0 0' }}>
          FAP is about these moments in the therapy relationship, when a compassionate understanding of the other person allows you to <b style={{ color: C.crimson, fontWeight: 500 }}>see</b> and <b style={{ color: C.crimson, fontWeight: 500 }}>evoke</b> and <b style={{ color: C.crimson, fontWeight: 500 }}>reinforce</b> a different way of relating.
          <cite style={{ display: 'block', marginTop: 30, fontStyle: 'normal', fontFamily: F.sans, fontWeight: 500, fontSize: 28, color: C.inkSoft, letterSpacing: '.04em' }}>
            — Shape Process with the Five Rules of FAP
          </cite>
        </blockquote>
      </Reveal>
      <Reveal d={320}>
        <div style={{ marginTop: 60, fontFamily: F.serif, fontWeight: 900, fontSize: 30, color: C.crimson, letterSpacing: '.3em' }}>כאן · ועכשיו</div>
      </Reveal>
    </Pad>
  </Scene>
);

/* House transition — quiet RISE, held across the deck. */
export const transition: SlideTransition = {
  duration: 200,
  exit: {
    duration: 140,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-4px)' },
    ],
  },
  enter: {
    duration: 200,
    delay: 80,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

export const meta: SlideMeta = {
  title: 'חמשת כללי ה־FAP · עיצוב התהליך — פרק 5',
  createdAt: '2026-06-13T22:47:40.781Z',
};

export default [
  PTitle,
  POpening,
  PCrb,
  POverview,
  PCycle,
  PRule1Open,
  PRule1Essence,
  PRule1Ex,
  PRule2Open,
  PRule2Essence,
  PRule2Ex,
  PRule3Open,
  PRule3How,
  PRule3Ex,
  PRule4Open,
  PRule4Body,
  PRule5Open,
  PRule5Ways,
  PRule5Ex,
  PDialogue,
  PSummary,
  PClosing,
] satisfies Page[];
