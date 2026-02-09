'use client';

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';

const CX = 960;
const CY = 500;
const R = 280;
const EXPORT_W = 2560;
const EXPORT_H = 1440;

const deg2rad = (d: number) => (d * Math.PI) / 180;

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = deg2rad(angleDeg - 90);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function slicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [sx, sy] = pointOnCircle(cx, cy, r, startDeg);
  const [ex, ey] = pointOnCircle(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} Z`;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

interface CounterProps {
  target: number;
  duration?: number;
  active: boolean;
  color: string;
  fontSize?: number;
  bold?: boolean;
  decimals?: number;
  suffix?: string;
}

function Counter({ target, duration = 800, active, color, fontSize = 72, bold = false, decimals = 0, suffix = '' }: CounterProps) {
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
    if (!active) { startedRef.current = false; setVal(0); return; }
    if (startedRef.current) return;
    startedRef.current = true;
    const t0 = performance.now();
    const step = (now: number) => {
      if (!activeRef.current) return;
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();

  return (
    <tspan fill={color} fontSize={fontSize}
      fontWeight={bold ? 'bold' : 'normal'}
      style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}{suffix}
    </tspan>
  );
}

export interface PieChartParams {
  percent?: number;
  onReplay?: () => void;
  onExport?: () => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

export interface PieChartHandle {
  replay: () => void;
}

const PieChart = forwardRef<PieChartHandle, PieChartParams>(
  ({ percent = 5.4, onReplay, onExport, svgRef: externalSvgRef }, ref) => {
    const internalSvgRef = useRef<SVGSVGElement>(null);
    const svgRef = externalSvgRef || internalSvgRef;
    const [phase, setPhase] = useState(-1);
    const [scale, setScale] = useState(0);
    const [explode, setExplode] = useState(0);
    const [bigFill, setBigFill] = useState(0);
    const timersRef = useRef<number[]>([]);

    const SLICE_DEG = (percent / 100) * 360;

    const animateVal = useCallback((from: number, to: number, dur: number, setter: (val: number) => void, easeFn: (t: number) => number = easeInOutCubic) => {
      return new Promise<void>((resolve) => {
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setter(from + (to - from) * easeFn(p));
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    }, []);

    const wait = (ms: number): Promise<void> => new Promise((r) => {
      const id = window.setTimeout(r, ms);
      timersRef.current.push(id);
    });

    const runAnimation = useCallback(async () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      setScale(0);
      setExplode(0);
      setBigFill(0);
      setPhase(-1);

      await wait(200);
      setPhase(0);
      await animateVal(0, 1, 600, setScale, easeOutBack);

      setPhase(1);
      await wait(800);

      setPhase(2);
      await animateVal(0, 1, 800, setExplode, easeInOutCubic);
      await wait(1000);

      setPhase(3);
      await animateVal(0, 1, 800, setBigFill, easeInOutCubic);
      await wait(500);

      setPhase(4);
      await wait(1000);

      setPhase(5);
      await animateVal(1, 0, 500, setScale, easeInBack);
      setPhase(6);
    }, [animateVal, percent]);

    useImperativeHandle(ref, () => ({
      replay: () => runAnimation(),
    }));

    useEffect(() => { runAnimation(); return () => timersRef.current.forEach(clearTimeout); }, [runAnimation]);

    const smallPath = slicePath(CX, CY, R, 0, SLICE_DEG);

    const bisector = SLICE_DEG / 2;
    const explodeDist = 35 * explode;
    const edx = explodeDist * Math.sin(deg2rad(bisector));
    const edy = -explodeDist * Math.cos(deg2rad(bisector));

    const labelR = R + 90 + 20 * explode;
    const lx = CX + labelR * Math.sin(deg2rad(bisector));
    const ly = CY - labelR * Math.cos(deg2rad(bisector));

    const bigBisector = SLICE_DEG + (360 - SLICE_DEG) / 2;
    const blx = CX + 30 * Math.sin(deg2rad(bigBisector));
    const bly = CY - 30 * Math.cos(deg2rad(bigBisector)) + 64;

    const bigPercent = 100 - percent;

    return (
      <div style={{
        width: '100%', height: '100%', backgroundColor: '#1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feFlood floodColor="#2dd4bf" floodOpacity="0.5" result="c" />
              <feComposite in="c" in2="b" operator="in" result="g" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect width="1920" height="1080" fill="#1e1e1e" />

          <g transform={`translate(${CX}, ${CY}) scale(${scale}) translate(${-CX}, ${-CY})`}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8e4dc" strokeWidth="3" />

            {phase >= 3 && (
              <circle cx={CX} cy={CY} r={R} fill="white" opacity={bigFill} />
            )}

            {phase >= 2 && (
              <g transform={`translate(${edx}, ${edy})`}>
                <path d={smallPath} fill="#2dd4bf" />
              </g>
            )}

            {phase >= 2 && (
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fontFamily="Georgia, 'Times New Roman', serif" filter="url(#glow)"
                style={{ opacity: 1, transition: 'opacity 0.5s' }}>
                <Counter target={percent} duration={1000} active={phase >= 2}
                  color="#2dd4bf" fontSize={72} bold={true} decimals={1} suffix="%" />
              </text>
            )}

            {phase >= 3 && (
              <text x={blx} y={bly} textAnchor="middle" dominantBaseline="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                style={{ opacity: bigFill }}>
                <Counter target={bigPercent} duration={1000} active={phase >= 3}
                  color="#2a2a2a" fontSize={64} decimals={1} suffix="%" />
              </text>
            )}
          </g>
        </svg>

        <div style={{ position: 'absolute', bottom: 28, right: 28, display: 'flex', gap: 12 }}>
          {onExport && (
            <button onClick={onExport} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#e8e4dc', fontFamily: 'Georgia, serif', fontSize: 16,
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              opacity: phase === 6 ? 0.7 : 0,
              pointerEvents: phase === 6 ? 'auto' : 'none',
              transition: 'opacity 0.5s, background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.15)'; e.currentTarget.style.borderColor = '#2dd4bf'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >
              Export 2K
            </button>
          )}

          <button onClick={() => { if (onReplay) onReplay(); else runAnimation(); }} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#e8e4dc', fontFamily: 'Georgia, serif', fontSize: 16,
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            opacity: phase === 6 ? 0.7 : 0,
            pointerEvents: phase === 6 ? 'auto' : 'none',
            transition: 'opacity 0.5s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            ↻ Replay
          </button>
        </div>
      </div>
    );
  }
);

PieChart.displayName = 'PieChart';

export default PieChart;
