'use client';

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';

const CX = 960;
const CY = 480;
const SIZE = 740;
const TRI_TOP = CY - SIZE / 2;
const TRI_BOTTOM = CY + SIZE / 2;
const TRI_LEFT = CX - SIZE / 2;
const TRI_RIGHT = CX + SIZE / 2;

const DIV1_Y = TRI_TOP + SIZE * 0.58; // white starts here
const DIV2_Y = TRI_TOP + SIZE * 0.68; // teal starts here

const triPoints = `${TRI_LEFT},${TRI_TOP} ${TRI_RIGHT},${TRI_TOP} ${CX},${TRI_BOTTOM}`;

function widthAtY(y: number): number {
  return (TRI_RIGHT - TRI_LEFT) * (1 - (y - TRI_TOP) / (TRI_BOTTOM - TRI_TOP));
}
function leftAtY(y: number): number { return CX - widthAtY(y) / 2; }
function rightAtY(y: number): number { return CX + widthAtY(y) / 2; }

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

interface CounterProps {
  target: number;
  duration?: number;
  active: boolean;
  color: string;
  fontSize?: number;
  bold?: boolean;
}

function Counter({ target, duration = 800, active, color, fontSize = 72, bold = false }: CounterProps) {
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
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);

  return (
    <tspan fill={color} fontSize={fontSize}
      fontWeight={bold ? 'bold' : 'normal'}
      style={{ fontVariantNumeric: 'tabular-nums' }}>
      {val.toLocaleString()}
    </tspan>
  );
}

export interface SurveyFunnelParams {
  topValue?: number;
  middleValue?: number;
  bottomValue?: number;
  onReplay?: () => void;
  onExport?: () => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

export interface SurveyFunnelHandle {
  replay: () => void;
}

const SurveyFunnel = forwardRef<SurveyFunnelHandle, SurveyFunnelParams>(
  ({ topValue = 8178, middleValue = 1043, bottomValue = 771, onReplay, onExport, svgRef: externalSvgRef }, ref) => {
    const internalSvgRef = useRef<SVGSVGElement>(null);
    const svgRef = externalSvgRef || internalSvgRef;
    const [whiteTop, setWhiteTop] = useState(TRI_TOP);
    const [tealTop, setTealTop] = useState(TRI_BOTTOM);
    const [phase, setPhase] = useState(-1);
    const [scale, setScale] = useState(0);
    const timersRef = useRef<number[]>([]);

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

    const run = useCallback(async () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      setWhiteTop(TRI_TOP);
      setTealTop(TRI_BOTTOM);
      setScale(0);
      setPhase(-1);

      await wait(200);
      setPhase(0);
      await animateVal(0, 1, 600, setScale, easeOutBack);

      setPhase(1);
      await wait(1500);

      setPhase(2);
      await animateVal(TRI_TOP, DIV1_Y, 1000, setWhiteTop);
      await wait(1000);

      setPhase(3);
      await animateVal(TRI_BOTTOM, DIV2_Y, 1000, setTealTop);
      setPhase(4);
    }, [animateVal]);

    useImperativeHandle(ref, () => ({
      replay: () => run(),
    }));

    useEffect(() => { run(); return () => timersRef.current.forEach(clearTimeout); }, [run]);

    const t8Y = TRI_TOP + SIZE * 0.22;
    const t1Y = DIV1_Y - 45;
    const t7midY = (DIV2_Y + TRI_BOTTOM) / 2;
    const tealLeftAt771 = leftAtY(t7midY);

    return (
      <div style={{
        width: '100%', height: '100%', backgroundColor: '#1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet">
          <defs>
            <clipPath id="tri"><polygon points={triPoints} /></clipPath>
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feFlood floodColor="#2dd4bf" floodOpacity="0.5" result="c" />
              <feComposite in="c" in2="b" operator="in" result="g" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g transform={`translate(${CX}, ${CY}) scale(${scale}) translate(${-CX}, ${-CY})`}>
            <polygon points={triPoints} fill="none" stroke="#e8e4dc" strokeWidth="3" />

            <rect x="0" y={whiteTop} width="1920" height={Math.max(0, TRI_BOTTOM - whiteTop)}
              fill="white" clipPath="url(#tri)" />

            <rect x="0" y={tealTop} width="1920" height={Math.max(0, TRI_BOTTOM - tealTop)}
              fill="#2dd4bf" clipPath="url(#tri)" />

            <line x1={leftAtY(DIV1_Y)} y1={DIV1_Y} x2={rightAtY(DIV1_Y)} y2={DIV1_Y}
              stroke="white" strokeWidth="3"
              style={{ opacity: phase >= 2 ? 0.85 : 0, transition: 'opacity 0.4s' }} />

            {phase >= 1 && (
              <text x={CX} y={t8Y} textAnchor="middle" dominantBaseline="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                style={{ opacity: 1, transition: 'opacity 0.5s' }}>
                <Counter target={topValue} duration={1200} active={phase >= 1}
                  color={phase >= 2 ? 'rgba(232,228,220,0.3)' : '#2a2a2a'} fontSize={80} />
              </text>
            )}

            {phase >= 2 && (
              <text x={CX} y={t1Y} textAnchor="middle" dominantBaseline="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                style={{ opacity: 1, transition: 'opacity 0.5s' }}>
                <Counter target={middleValue} duration={1000} active={phase >= 2}
                  color="white" fontSize={68} />
              </text>
            )}

            {phase >= 3 && (
              <text x={tealLeftAt771 - 85} y={t7midY} textAnchor="end" dominantBaseline="middle"
                fontFamily="Georgia, 'Times New Roman', serif" filter="url(#glow)"
                style={{ opacity: 1, transition: 'opacity 0.5s' }}>
                <Counter target={bottomValue} duration={1000} active={phase >= 3}
                  color="#2dd4bf" fontSize={72} bold={true} />
              </text>
            )}
          </g>
        </svg>

        <button onClick={() => { if (onReplay) onReplay(); else run(); }} style={{
          position: 'absolute', bottom: 28, right: 28,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#e8e4dc', fontFamily: 'Georgia, serif', fontSize: 16,
          padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
          opacity: phase === 4 ? 0.7 : 0, pointerEvents: phase === 4 ? 'auto' : 'none',
          transition: 'opacity 0.5s, background 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          ↻ Replay
        </button>

        {onExport && (
          <button onClick={onExport} style={{
            position: 'absolute', bottom: 28, right: 120,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#e8e4dc', fontFamily: 'Georgia, serif', fontSize: 16,
            padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
            opacity: phase === 4 ? 0.7 : 0, pointerEvents: phase === 4 ? 'auto' : 'none',
            transition: 'opacity 0.5s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.15)'; e.currentTarget.style.borderColor = '#2dd4bf'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            Export 4K
          </button>
        )}
      </div>
    );
  }
);

SurveyFunnel.displayName = 'SurveyFunnel';

export default SurveyFunnel;
