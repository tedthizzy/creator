'use client';

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';

const BAR_LEFT = 540;
const BAR_MAX_W = 860;
const BAR_H = 48;
const ROW_H = 74;
const START_Y = 260;

// Easing functions
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface BarChartFeature {
  label: string;
  pct: number;
  highlight: boolean;
}

export interface BarChartParams {
  features: BarChartFeature[];
  onReplay?: () => void;
  onExport?: () => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

export interface BarChartHandle {
  replay: () => void;
}

const BarChart = forwardRef<BarChartHandle, BarChartParams>(
  ({ features, onReplay, onExport, svgRef: externalSvgRef }, ref) => {
    const internalSvgRef = useRef<SVGSVGElement>(null);
    const svgRef = externalSvgRef || internalSvgRef;
    const [phase, setPhase] = useState(-1);
    const [scale, setScale] = useState(0);
    const [barProgress, setBarProgress] = useState<number[]>(features.map(() => 0));
    const [counterVals, setCounterVals] = useState<number[]>(features.map(() => 0));
    const [secondHighlighted, setSecondHighlighted] = useState(false);
    const timersRef = useRef<number[]>([]);
    const cancelledRef = useRef(false);

  const wait = (ms: number): Promise<void> =>
    new Promise((r) => {
      const id = window.setTimeout(r, ms);
      timersRef.current.push(id);
    });

  const animateVal = useCallback(
    (
      from: number,
      to: number,
      dur: number,
      setter: (val: number) => void,
      easeFn: (t: number) => number = easeInOutCubic
    ): Promise<void> => {
      return new Promise((resolve) => {
        const t0 = performance.now();
        const step = (now: number) => {
          if (cancelledRef.current) return;
          const p = Math.min((now - t0) / dur, 1);
          setter(from + (to - from) * easeFn(p));
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    },
    []
  );

  const run = useCallback(
    async () => {
      cancelledRef.current = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      cancelledRef.current = false;

      setScale(0);
      setPhase(-1);
      setSecondHighlighted(false);
      setBarProgress(features.map(() => 0));
      setCounterVals(features.map(() => 0));

      await wait(200);

      // Phase 0: scale in
      setPhase(0);
      await animateVal(0, 1, 600, setScale, easeOutBack);

      await wait(400);

      // Phase 1: animate bars staggered
      setPhase(1);
      const STAGGER = 180;
      const BAR_DUR = 700;

      const barAnimations = features.map((f, i) => {
        return new Promise<void>((resolve) => {
          const delay = i * STAGGER;
          const id = window.setTimeout(() => {
            if (cancelledRef.current) return resolve();
            const t0 = performance.now();
            const step = (now: number) => {
              if (cancelledRef.current) return resolve();
              const p = Math.min((now - t0) / BAR_DUR, 1);
              const eased = easeOutCubic(p);

              setBarProgress((prev) => {
                const next = [...prev];
                next[i] = eased;
                return next;
              });
              setCounterVals((prev) => {
                const next = [...prev];
                next[i] = Math.round(eased * f.pct);
                return next;
              });

              if (p < 1) requestAnimationFrame(step);
              else resolve();
            };
            requestAnimationFrame(step);
          }, delay);
          timersRef.current.push(id);
        });
      });

      await Promise.all(barAnimations);
      await wait(200);
      setPhase(2);

      // Phase 2: pause then highlight second bar
      await wait(500);
      setSecondHighlighted(true);
      setPhase(3);

      // Phase 3: pause then zoom out
      await wait(1000);
      setPhase(4);
      await animateVal(1, 0, 600, setScale, easeInBack);
      setPhase(5);
    },
    [features, animateVal]
  );

  // Expose replay function via ref
  useImperativeHandle(ref, () => ({
    replay: () => run(),
  }));

  useEffect(() => {
    run();
    return () => {
      cancelledRef.current = true;
      timersRef.current.forEach(clearTimeout);
    };
  }, [run]);

  // Find min/max percentages for scaling
  const minPct = Math.min(...features.map(f => f.pct));
  const maxPct = Math.max(...features.map(f => f.pct));
  const pctRange = maxPct - minPct || 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="1920" height="1080" fill="#1e1e1e" />

        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feFlood floodColor="#2dd4bf" floodOpacity="0.5" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          transform={`translate(960, 540) scale(${scale}) translate(-960, -540)`}
        >
          {features.map((f, i) => {
            const y = START_Y + i * ROW_H;
            // Scale bar width based on percentage relative to min/max
            const normalizedPct = (f.pct - minPct) / pctRange;
            const barW = barProgress[i] * normalizedPct * BAR_MAX_W;
            const isTeal = i === 0 ? f.highlight : (i === 1 ? secondHighlighted : false);
            const barColor = isTeal ? '#2dd4bf' : '#ffffff';
            const barOpacity = isTeal ? 0.9 : 0.25;
            const labelColor = isTeal
              ? 'rgba(232,228,220,0.85)'
              : 'rgba(232,228,220,0.35)';
            const numColor = isTeal ? '#2dd4bf' : 'rgba(232,228,220,0.5)';

            return (
              <g key={i}>
                {phase >= 0 && (
                  <text
                    x={BAR_LEFT - 24}
                    y={y + BAR_H / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize={21}
                    fill={labelColor}
                    style={{ transition: 'fill 0.4s' }}
                  >
                    {f.label}
                  </text>
                )}

                <rect
                  x={BAR_LEFT}
                  y={y}
                  width={Math.max(0, barW)}
                  height={BAR_H}
                  rx={4}
                  fill={barColor}
                  opacity={barOpacity}
                  style={{ transition: 'fill 0.4s, opacity 0.4s' }}
                />

                {barProgress[i] > 0.05 && (
                  <text
                    x={BAR_LEFT + barW + 18}
                    y={y + BAR_H / 2}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize={isTeal ? 36 : 28}
                    fontWeight={isTeal ? 'bold' : 'normal'}
                    fill={numColor}
                    filter={isTeal ? 'url(#glow)' : undefined}
                    style={{ fontVariantNumeric: 'tabular-nums', transition: 'fill 0.4s, font-size 0.4s' }}
                  >
                    {counterVals[i]}%
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          right: 28,
          display: 'flex',
          gap: 12,
          opacity: phase === 5 ? 0.7 : 0,
          pointerEvents: phase === 5 ? 'auto' : 'none',
          transition: 'opacity 0.5s',
        }}
      >
        <button
          onClick={() => {
            if (onReplay) onReplay();
            else run();
          }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e8e4dc',
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            padding: '8px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.borderColor = '#2dd4bf';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
        >
          ↻ Replay
        </button>

        <button
          onClick={onExport}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e8e4dc',
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            padding: '8px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(45,212,191,0.15)';
            e.currentTarget.style.borderColor = '#2dd4bf';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
        >
          Export 4K
        </button>
      </div>
    </div>
  );
});

BarChart.displayName = 'BarChart';

export default BarChart;
