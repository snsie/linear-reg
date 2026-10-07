import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Code2,
  FlaskConical,
  Gauge,
  LineChart,
  RefreshCw,
  Scaling,
  Sparkles,
  Spline,
  Target,
} from 'lucide-react'

const INK = '#17323a'
const NAVY = '#173f5f'
const ORANGE = '#e8763b'
const RED = '#d34a4a'
const TEAL = '#278c85'

const notebookMeta = [
  {
    number: '01',
    kicker: 'Observe',
    title: 'Meet the data',
    short: 'Explore a simulated clinic sample.',
    icon: FlaskConical,
    color: '#e8763b',
  },
  {
    number: '02',
    kicker: 'Fit',
    title: 'Find the line',
    short: 'Drag a line and minimize error.',
    icon: Target,
    color: '#2d7f7a',
  },
  {
    number: '03',
    kicker: 'Explain',
    title: 'Why least squares?',
    short: 'See why one unique line wins.',
    icon: Sparkles,
    color: '#5277a8',
  },
  {
    number: '04',
    kicker: 'Scale',
    title: 'Stretch the spread',
    short: 'Change the SDs and watch the slope respond.',
    icon: Scaling,
    color: '#5b8c3a',
  },
  {
    number: '05',
    kicker: 'Check',
    title: 'Diagnose the model',
    short: 'Read residuals, R², and RMSE.',
    icon: Activity,
    color: '#8b5fa4',
  },
  {
    number: '06',
    kicker: 'Apply',
    title: 'Make a prediction',
    short: 'Predict carefully and avoid extrapolation.',
    icon: Gauge,
    color: '#d09a2f',
  },
  {
    number: '07',
    kicker: 'Extend',
    title: 'Bend the line',
    short: 'Compare a straight line with a curve on the same data.',
    icon: Spline,
    color: '#c0577d',
    topic: 'Dose → BP drop',
    extension: true,
  },
]

const NOTEBOOK_COUNT = notebookMeta.length
const LAST_NOTEBOOK = NOTEBOOK_COUNT - 1

function makePatients(noise = 10, sample = 0, scenario = 'linear', outlier = false) {
  const points = Array.from({ length: 48 }, (_, i) => {
    const wave = Math.sin(i * 12.9898 + sample * 3.17) * 43758.5453
    const wave2 = Math.cos(i * 6.733 + sample * 1.91) * 13631.71
    const randomA = wave - Math.floor(wave)
    const randomB = wave2 - Math.floor(wave2)
    const bmi = 17 + randomA * 25
    const base = scenario === 'curved'
      ? 106 + 0.26 * (bmi - 26) ** 2
      : 68.5 + 2.4 * bmi
    const error = ((randomB - 0.5) * 1.75 + Math.sin(i * 2.2) * 0.35) * noise
    return { bmi, bp: base + error, id: i + 1 }
  })
  if (outlier) points.push({ bmi: 42, bp: 105, id: 49, outlier: true })
  return points.sort((a, b) => a.bmi - b.bmi)
}

function regression(points) {
  const n = points.length
  const xMean = points.reduce((sum, p) => sum + p.bmi, 0) / n
  const yMean = points.reduce((sum, p) => sum + p.bp, 0) / n
  const numerator = points.reduce((sum, p) => sum + (p.bmi - xMean) * (p.bp - yMean), 0)
  const denominator = points.reduce((sum, p) => sum + (p.bmi - xMean) ** 2, 0)
  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  const predictions = points.map((p) => intercept + slope * p.bmi)
  const residuals = points.map((p, i) => p.bp - predictions[i])
  const ssr = residuals.reduce((sum, value) => sum + value ** 2, 0)
  const sst = points.reduce((sum, p) => sum + (p.bp - yMean) ** 2, 0)
  return {
    slope,
    intercept,
    xMean,
    yMean,
    ssr,
    r2: 1 - ssr / sst,
    rmse: Math.sqrt(ssr / n),
    residuals,
  }
}

const fmt = (n, digits = 1) => Number(n).toFixed(digits)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const scrollToTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })

// Percentage of a range input's track that should render as "filled".
const rangeFill = (value, min, max) => ({
  '--fill': `${Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))}%`,
})

// Fades and lifts its element into place the first time it scrolls into view.
function Rise({ as: Tag = 'div', className = '', delay = 0, style, children, ...rest }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || !('IntersectionObserver' in window)) {
      setInView(true)
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true)
        observer.disconnect()
      }
    }, { rootMargin: '0px 0px -6% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <Tag
      ref={ref}
      className={`rise${inView ? ' is-in' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--delay': delay, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// Word-by-word masked reveal, triggered when an ancestor `.rise` becomes visible.
function KineticText({ as: Tag = 'span', lines, className = '', ...rest }) {
  let wordIndex = 0
  return (
    <Tag className={`kinetic${className ? ` ${className}` : ''}`} aria-label={lines.map((line) => line.text).join(' ')} {...rest}>
      {lines.map((line, lineIndex) => {
        const words = line.text.split(' ')
        const content = words.map((word, i) => (
          <Fragment key={i}>
            <span className="word"><span className="word-inner" style={{ '--w': wordIndex++ }}>{word}</span></span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        ))
        return (
          <span key={lineIndex} className={`kinetic-line${line.accent ? ' accent' : ''}`} aria-hidden="true">
            {line.accent ? (
              <em>
                {content}
                <svg className="kinetic-underline" viewBox="0 0 300 18" preserveAspectRatio="none" style={{ '--w': wordIndex }}>
                  <path d="M3 15 C 90 13, 190 8, 297 3" pathLength="1" />
                </svg>
              </em>
            ) : content}
          </span>
        )
      })}
    </Tag>
  )
}

function AxisLabel({ x, y, children, rotate = false }) {
  return (
    <text
      x={x}
      y={y}
      transform={rotate ? `rotate(-90 ${x} ${y})` : undefined}
      textAnchor="middle"
      className="axis-label"
    >
      {children}
    </text>
  )
}

function ScatterPlot({
  points,
  model,
  userLine,
  showBest = false,
  showResiduals = false,
  predictionX,
  compact = false,
  xDomain: [xMin, xMax] = [15, 58],
  yDomain: [yMin, yMax] = [90, 180],
  xTicks = [20, 30, 40, 50],
  yTicks = [100, 120, 140, 160, 180],
}) {
  const width = 720
  const height = compact ? 360 : 430
  const margin = { top: 24, right: 22, bottom: 55, left: 68 }
  const px = (value) => margin.left + ((value - xMin) / (xMax - xMin)) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom)
  const line = (intercept, slope, color, dash, strokeWidth = 3) => {
    const ax = xMin
    const bx = xMax
    return (
      <line
        x1={px(ax)}
        y1={py(intercept + slope * ax)}
        x2={px(bx)}
        y2={py(intercept + slope * bx)}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
    )
  }
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter plot of BMI and systolic blood pressure">
        <defs>
          <clipPath id={`plot-${compact ? 'small' : 'large'}-${showResiduals ? 'res' : 'plain'}`}>
            <rect x={margin.left} y={margin.top} width={width - margin.left - margin.right} height={height - margin.top - margin.bottom} />
          </clipPath>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={py(tick)} y2={py(tick)} className="grid-line" />
            <text x={margin.left - 13} y={py(tick) + 4} textAnchor="end" className="tick-label">{tick}</text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={px(tick)} x2={px(tick)} y1={margin.top} y2={height - margin.bottom} className="grid-line vertical" />
            <text x={px(tick)} y={height - margin.bottom + 25} textAnchor="middle" className="tick-label">{tick}</text>
          </g>
        ))}
        <g clipPath={`url(#plot-${compact ? 'small' : 'large'}-${showResiduals ? 'res' : 'plain'})`}>
          {showResiduals && userLine && points.map((p) => (
            <line
              key={`r-${p.id}`}
              x1={px(p.bmi)}
              x2={px(p.bmi)}
              y1={py(p.bp)}
              y2={py(userLine.intercept + userLine.slope * p.bmi)}
              stroke={RED}
              strokeWidth="1.4"
              opacity=".55"
            />
          ))}
          {userLine && line(userLine.intercept, userLine.slope, ORANGE, undefined, 4)}
          {showBest && line(model.intercept, model.slope, NAVY, '9 7', 3)}
          {predictionX && (
            <>
              <line x1={px(predictionX)} x2={px(predictionX)} y1={py(yMin)} y2={py(model.intercept + model.slope * predictionX)} stroke={TEAL} strokeDasharray="5 5" strokeWidth="2" />
              <circle cx={px(predictionX)} cy={py(model.intercept + model.slope * predictionX)} r="8" fill={TEAL} stroke="#fff" strokeWidth="3" />
            </>
          )}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={px(p.bmi)}
              cy={py(p.bp)}
              r={p.outlier ? 6 : 4.6}
              fill={p.outlier ? RED : INK}
              opacity={p.outlier ? 1 : 0.76}
              stroke="#fff"
              strokeWidth="1.2"
            />
          ))}
          {showBest && (
            <g transform={`translate(${px(model.xMean)} ${py(model.yMean)})`}>
              <line x1="-7" x2="7" y1="-7" y2="7" stroke={INK} strokeWidth="3" />
              <line x1="-7" x2="7" y1="7" y2="-7" stroke={INK} strokeWidth="3" />
            </g>
          )}
        </g>
        <AxisLabel x={(margin.left + width - margin.right) / 2} y={height - 11}>BMI (kg/m²)</AxisLabel>
        <AxisLabel x={18} y={(margin.top + height - margin.bottom) / 2} rotate>Systolic BP (mmHg)</AxisLabel>
      </svg>
    </div>
  )
}

function ResidualPlot({ points, model }) {
  const width = 720
  const height = 300
  const margin = { top: 22, right: 22, bottom: 52, left: 68 }
  const px = (value) => margin.left + ((value - 15) / 30) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - ((value + 70) / 140) * (height - margin.top - margin.bottom)
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Residual plot">
        {[-60, -30, 0, 30, 60].map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={py(tick)} y2={py(tick)} className={tick === 0 ? 'zero-line' : 'grid-line'} />
            <text x={margin.left - 13} y={py(tick) + 4} textAnchor="end" className="tick-label">{tick}</text>
          </g>
        ))}
        {[20, 30, 40].map((tick) => (
          <text key={tick} x={px(tick)} y={height - 20} textAnchor="middle" className="tick-label">{tick}</text>
        ))}
        {points.map((p, index) => (
          <circle key={p.id} cx={px(p.bmi)} cy={py(model.residuals[index])} r="5" fill={p.outlier ? RED : '#8b5fa4'} opacity=".84" stroke="#fff" strokeWidth="1.2" />
        ))}
        <AxisLabel x={width / 2} y={height - 4}>BMI (kg/m²)</AxisLabel>
        <AxisLabel x={18} y={height / 2} rotate>Residual (mmHg)</AxisLabel>
      </svg>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, suffix = '' }) {
  return (
    <label className="slider-control">
      <span className="slider-label"><span>{label}</span><strong>{value}{suffix}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} style={rangeFill(value, min, max)} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function Callout({ icon: Icon = Sparkles, tone = 'orange', title, children }) {
  return (
    <aside className={`callout ${tone}`}>
      <span className="callout-icon"><Icon size={18} aria-hidden="true" /></span>
      <div><strong>{title}</strong><p>{children}</p></div>
    </aside>
  )
}

function Metric({ label, value, note, accent }) {
  return (
    <div className="metric" style={{ '--accent': accent || ORANGE }}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  )
}

function NotebookHeader({ meta, eyebrow, children }) {
  const Icon = meta.icon
  const headingRef = useRef(null)
  // Each notebook mounts on navigation, so move focus to its title for keyboard and screen reader users.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  return (
    <Rise className="notebook-heading" style={{ '--notebook-color': meta.color }}>
      <div className="notebook-index">
        <Icon size={22} />
        <span>{meta.number}</span>
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <KineticText as="h2" ref={headingRef} tabIndex={-1} lines={[{ text: meta.title }]} />
        <p>{children}</p>
      </div>
    </Rise>
  )
}

function NotebookOne({ noise, setNoise, sample, setSample, points, model }) {
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[0]} eyebrow="Notebook 01 · 4 minutes">
        Start with the raw observations. Change the noise to see how patient-to-patient variation can blur a real trend.
      </NotebookHeader>

      <div className="two-column">
        <Rise className="panel chart-panel" delay={1}>
          <div className="panel-topline">
            <div><span className="panel-kicker">Simulated clinic</span><h3>BMI and systolic blood pressure</h3></div>
            <button className="icon-button" onClick={() => setSample((value) => value + 1)} title="Draw a new patient sample">
              <RefreshCw size={17} />
              <span>Resample</span>
            </button>
          </div>
          <ScatterPlot points={points} model={model} userLine={{ intercept: 68.5, slope: 2.4 }} compact />
          <div className="legend-row">
            <span><i className="dot patient" /> 48 simulated patients</span>
            <span><i className="line true" /> Generating line</span>
          </div>
        </Rise>

        <div className="stack">
          <Rise className="panel controls-panel" delay={2}>
            <div className="panel-topline compact"><div><span className="panel-kicker">Control</span><h3>How scattered are the patients?</h3></div></div>
            <Slider label="Noise" value={noise} min={4} max={20} step={1} onChange={setNoise} suffix=" mmHg" />
            <div className="noise-scale"><span>Tight fit</span><span>Messy clinic</span></div>
            <div className="mini-metrics">
              <Metric label="R²" value={fmt(model.r2, 2)} note="variance explained" accent={TEAL} />
              <Metric label="RMSE" value={`${fmt(model.rmse)} mmHg`} note="typical miss" accent={ORANGE} />
            </div>
          </Rise>
          <Rise delay={3}>
            <Callout title="Notice what stays steady">
              More noise weakens prediction, but it does not erase the underlying positive relationship.
            </Callout>
          </Rise>
        </div>
      </div>

      <Rise className="data-strip panel">
        <div className="data-strip-title"><BarChart3 size={18} /><strong>First five patients</strong><span>Sample {sample + 1}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th><th>BMI</th><th>Systolic BP</th><th>Position</th></tr></thead>
            <tbody>
              {points.slice(0, 5).map((p) => (
                <tr key={p.id}><td>#{String(p.id).padStart(2, '0')}</td><td>{fmt(p.bmi)}</td><td>{fmt(p.bp, 0)} mmHg</td><td><span className={p.bp > 68.5 + 2.4 * p.bmi ? 'pill above' : 'pill below'}>{p.bp > 68.5 + 2.4 * p.bmi ? 'Above line' : 'Below line'}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Rise>
    </section>
  )
}

function NotebookTwo({ points, model }) {
  const [intercept, setIntercept] = useState(110)
  const [slope, setSlope] = useState(0.5)
  const [showBest, setShowBest] = useState(false)
  const userSsr = points.reduce((sum, p) => sum + (p.bp - (intercept + slope * p.bmi)) ** 2, 0)
  const meanResidual = points.reduce((sum, p) => sum + p.bp - (intercept + slope * p.bmi), 0) / points.length
  const ratio = userSsr / model.ssr
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[1]} eyebrow="Notebook 02 · 7 minutes">
        Adjust the intercept and slope. The red vertical gaps are residuals; your goal is to make their squared total as small as possible.
      </NotebookHeader>

      <div className="fit-layout">
        <Rise className="panel chart-panel" delay={1}>
          <div className="panel-topline">
            <div><span className="panel-kicker">Your model</span><h3>ŷ = {fmt(intercept)} + {fmt(slope, 2)} × BMI</h3></div>
            <button className={`reveal-button ${showBest ? 'active' : ''}`} aria-pressed={showBest} onClick={() => setShowBest((value) => !value)}>
              {showBest ? <Check size={16} /> : <Sparkles size={16} />}
              {showBest ? 'Least squares revealed' : 'Reveal least squares'}
            </button>
          </div>
          <ScatterPlot points={points} model={model} userLine={{ intercept, slope }} showBest={showBest} showResiduals />
          <div className="legend-row">
            <span><i className="line yours" /> Your line</span>
            <span><i className="line residual" /> Residuals</span>
            {showBest && <span><i className="line best" /> Least squares</span>}
          </div>
        </Rise>
        <div className="stack fit-controls">
          <Rise className="panel controls-panel" delay={2}>
            <span className="panel-kicker">Tune the line</span>
            <Slider label="Intercept (a)" value={intercept} min={45} max={125} step={0.5} onChange={setIntercept} />
            <Slider label="Slope (b)" value={slope} min={-0.5} max={5} step={0.05} onChange={setSlope} />
            <button className="secondary-button" onClick={() => { setIntercept(76.3); setSlope(2.11) }}>Get close</button>
          </Rise>
          <Rise className="metric-grid vertical" delay={3}>
            <Metric label="Your SSR" value={Math.round(userSsr).toLocaleString()} note="lower is better" accent={ORANGE} />
            <Metric label="Mean residual" value={`${meanResidual >= 0 ? '+' : ''}${fmt(meanResidual)} mmHg`} note={Math.abs(meanResidual) < 1 ? 'well centered' : meanResidual > 0 ? 'line sits too low' : 'line sits too high'} accent={RED} />
            <Metric label="Distance from best" value={`${fmt(ratio, 2)}×`} note={ratio < 1.05 ? 'within 5% — nice work' : 'keep tuning'} accent={TEAL} />
          </Rise>
        </div>
      </div>

      <Rise>
        <Callout icon={Target} tone="navy" title="Why one line wins">
          Least squares tries every possible line and selects the unique one with the smallest sum of squared residuals.
        </Callout>
      </Rise>
    </section>
  )
}

const INTERCEPT_RANGE = [45, 125]
const SLOPE_RANGE = [-0.5, 5]

const sumSquaredResiduals = (points, intercept, slope) =>
  points.reduce((sum, p) => sum + (p.bp - (intercept + slope * p.bmi)) ** 2, 0)

function LeastSquaresPlot({ points, model, intercept, slope, compact = false }) {
  const width = 720
  const height = compact ? 360 : 340
  const margin = { top: 30, right: 30, bottom: 55, left: 74 }
  const slopes = Array.from({ length: 81 }, (_, i) => -1 + i * 0.075)
  // Best possible error for each slope: the intercept is free to pass through the point of averages.
  const profile = slopes.map((candidate) => sumSquaredResiduals(points, model.yMean - candidate * model.xMean, candidate))
  // Fix the vertical scale with enough headroom that, at any intercept, a well-tuned slope keeps the dot on screen.
  const sumX2 = points.reduce((sum, p) => sum + p.bmi ** 2, 0)
  const floorAtIntercept = (a) => {
    const cross = points.reduce((sum, p) => sum + p.bmi * (p.bp - a), 0)
    return points.reduce((sum, p) => sum + (p.bp - a) ** 2, 0) - cross ** 2 / sumX2
  }
  const max = Math.max(
    Math.min(Math.max(...profile), model.ssr * 12),
    1.25 * Math.max(...INTERCEPT_RANGE.map(floorAtIntercept)),
  )
  const px = (value) => margin.left + ((value + 1) / 6) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - ((value - model.ssr) / (max - model.ssr)) * (height - margin.top - margin.bottom)
  const toPath = (values) => slopes.map((candidate, i) => `${i ? 'L' : 'M'} ${px(candidate)} ${py(values[i])}`).join(' ')
  const currentSsr = sumSquaredResiduals(points, intercept, slope)
  const offScale = currentSsr > max
  const currentY = py(Math.min(currentSsr, max))
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sum of squared residuals by slope">
        <defs>
          <clipPath id="ssr-plot">
            <rect x={margin.left} y={margin.top - 10} width={width - margin.left - margin.right} height={height - margin.top - margin.bottom + 10} />
          </clipPath>
        </defs>
        {[0, .25, .5, .75, 1].map((portion) => {
          const y = model.ssr + portion * (max - model.ssr)
          return <line key={portion} x1={margin.left} x2={width - margin.right} y1={py(y)} y2={py(y)} className="grid-line" />
        })}
        {[-1, 0, 1, 2, 3, 4, 5].map((tick) => <text key={tick} x={px(tick)} y={height - 24} textAnchor="middle" className="tick-label">{tick}</text>)}
        <g clipPath="url(#ssr-plot)">
          <path d={toPath(profile)} fill="none" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
        </g>
        <line x1={px(model.slope)} x2={px(model.slope)} y1={py(model.ssr)} y2={height - margin.bottom} stroke={TEAL} strokeDasharray="5 5" strokeWidth="2" />
        <circle cx={px(model.slope)} cy={py(model.ssr)} r="8" fill={TEAL} stroke="#fff" strokeWidth="3" />
        <circle cx={px(slope)} cy={currentY} r="9" fill={ORANGE} stroke="#fff" strokeWidth="3" />
        {offScale && <text x={px(slope) + 14} y={currentY + 14} className="minimum-label off-scale">↑ off scale</text>}
        <text x={px(model.slope) + 11} y={py(model.ssr) - 11} className="minimum-label">minimum</text>
        <AxisLabel x={width / 2} y={height - 5}>Slope</AxisLabel>
        <AxisLabel x={20} y={height / 2} rotate>Sum of squared residuals</AxisLabel>
      </svg>
    </div>
  )
}

function NotebookThree({ points, model }) {
  const [intercept, setIntercept] = useState(110)
  const [slope, setSlope] = useState(0.5)
  const [showBest, setShowBest] = useState(false)
  const currentSsr = sumSquaredResiduals(points, intercept, slope)
  const r = Math.sqrt(Math.max(0, model.r2))
  const xSd = Math.sqrt(points.reduce((sum, p) => sum + (p.bmi - model.xMean) ** 2, 0) / points.length)
  const ySd = Math.sqrt(points.reduce((sum, p) => sum + (p.bp - model.yMean) ** 2, 0) / points.length)
  const formulaSlope = r * (ySd / xSd)
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[2]} eyebrow="Notebook 03 · 4 minutes">
        Tune the intercept and slope, then watch both views at once: your line and its residuals on the left, and where its error sits on the error curve on the right. Only one line reaches the bottom — the least-squares solution.
      </NotebookHeader>

      <div className="diagnostic-grid">
        <Rise className="panel chart-panel diagnostic" delay={1}>
          <div className="panel-topline compact">
            <div><span className="panel-kicker">Your model</span><h3>ŷ = {fmt(intercept)} + {fmt(slope, 2)} × BMI</h3></div>
            <button className={`reveal-button ${showBest ? 'active' : ''}`} aria-pressed={showBest} onClick={() => setShowBest((value) => !value)}>
              {showBest ? <Check size={16} /> : <Sparkles size={16} />}
              {showBest ? 'Least squares revealed' : 'Reveal least squares'}
            </button>
          </div>
          <ScatterPlot points={points} model={model} userLine={{ intercept, slope }} showBest={showBest} showResiduals compact />
          <div className="legend-row">
            <span><i className="line yours" /> Your line</span>
            <span><i className="line residual" /> Residuals</span>
            {showBest && <span><i className="line best" /> Least squares</span>}
          </div>
        </Rise>
        <Rise className="panel chart-panel diagnostic" delay={2}>
          <div className="panel-topline compact">
            <div><span className="panel-kicker">The optimization landscape</span><h3>SSR versus slope</h3></div>
            <span className="formula-chip">intercept fixed at {fmt(intercept)}</span>
          </div>
          <LeastSquaresPlot points={points} model={model} intercept={intercept} slope={slope} compact />
          <div className="legend-row">
            <span><i className="dot current-dot" /> Your line</span>
            <span><i className="line profile" /> Error with the best intercept</span>
            <span><i className="dot minimum-dot" /> Least-squares minimum</span>
          </div>
        </Rise>
      </div>

      <div className="dual-controls">
        <Rise className="panel controls-panel" delay={3}>
          <span className="panel-kicker">Tune the line</span>
          <Slider label="Intercept (a)" value={intercept} min={INTERCEPT_RANGE[0]} max={INTERCEPT_RANGE[1]} step={0.5} onChange={setIntercept} />
          <Slider label="Slope (b)" value={slope} min={SLOPE_RANGE[0]} max={SLOPE_RANGE[1]} step={0.05} onChange={setSlope} />
          <button className="secondary-button" onClick={() => { setIntercept(Number(model.intercept.toFixed(1))); setSlope(Number(model.slope.toFixed(2))) }}>Jump to minimum</button>
        </Rise>
        <Rise className="metric-grid" delay={4}>
          <Metric label="Your SSR" value={Math.round(currentSsr).toLocaleString()} note={`${fmt(currentSsr / model.ssr, 2)}× the minimum`} accent={ORANGE} />
          <Metric label="Best slope" value={fmt(model.slope, 2)} note="unique minimum" accent={TEAL} />
          <Metric label="Best intercept" value={fmt(model.intercept, 1)} note="line's anchor" accent={NAVY} />
        </Rise>
      </div>

      <Rise>
        <Callout icon={Target} tone="navy" title="Two curves, one bottom">
          The navy curve gives every slope its best possible intercept. Your orange dot only lands on that curve when your intercept is the best one for your slope, and it only reaches the teal minimum when both numbers match least squares.
        </Callout>
      </Rise>

      <Rise className="formula-panel panel">
        <div><span className="panel-kicker">Same line, two ways</span><h3>Formula and software agree</h3><p>The reading’s standard-units formula lands on the same slope as the computer fit.</p></div>
        <div className="formula-comparison">
          <div><small>From the formula</small><strong>r × SDᵧ / SDₓ = {fmt(formulaSlope, 2)}</strong></div>
          <ArrowRight size={20} />
          <div><small>From least squares</small><strong>linregress slope = {fmt(model.slope, 2)}</strong></div>
          <span className="match-badge"><Check size={14} /> Match</span>
        </div>
      </Rise>
    </section>
  )
}

// Notebook 04 rescales the clinic sample: every patient keeps its standard-unit position, only the spreads change.
const SD_X_RANGE = [3, 12]
const SD_Y_RANGE = [6, 36]
const RATIO_MAX = SD_Y_RANGE[1] / SD_X_RANGE[0]

const round1 = (value) => Math.round(value * 10) / 10
const clampTo = ([min, max], value) => Math.min(max, Math.max(min, value))
const sdOf = (values, mean) => Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)

// Round an axis outward to tidy ticks (steps of 1, 2, 2.5 or 5 × a power of ten).
function niceAxis(lo, hi, target = 6) {
  const raw = (hi - lo) / target
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)
  const min = Math.floor(lo / step) * step
  const max = Math.ceil(hi / step) * step
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => Number((min + i * step).toFixed(6)))
  return { domain: [min, max], ticks }
}

// Fixed axis sized for the widest spread the slider allows, so every setting is drawn on the same scale.
function stretchAxis(mean, z, maxSd) {
  const lo = mean + maxSd * Math.min(...z)
  const hi = mean + maxSd * Math.max(...z)
  const pad = (hi - lo) * 0.06
  return niceAxis(lo - pad, hi + pad)
}

function SlopeRatioPlot({ r, ratio, baseRatio }) {
  const width = 720
  const height = 360
  const margin = { top: 24, right: 22, bottom: 55, left: 68 }
  const ticks = [0, 3, 6, 9, 12]
  const px = (value) => margin.left + (value / RATIO_MAX) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - (value / RATIO_MAX) * (height - margin.top - margin.bottom)
  const slope = r * ratio
  const flip = ratio > RATIO_MAX * 0.72
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Slope versus spread ratio: a ratio of ${fmt(ratio, 2)} gives a slope of ${fmt(slope, 2)}`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={py(tick)} y2={py(tick)} className="grid-line" />
            <text x={margin.left - 13} y={py(tick) + 4} textAnchor="end" className="tick-label">{tick}</text>
            <line x1={px(tick)} x2={px(tick)} y1={margin.top} y2={height - margin.bottom} className="grid-line vertical" />
            <text x={px(tick)} y={height - margin.bottom + 25} textAnchor="middle" className="tick-label">{tick}</text>
          </g>
        ))}
        <line x1={px(0)} y1={py(0)} x2={px(RATIO_MAX)} y2={py(r * RATIO_MAX)} stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
        <text x={px(9) + 12} y={py(r * 9) + 26} className="ratio-label">slope = {fmt(r, 2)} × ratio</text>
        <line x1={px(ratio)} x2={px(ratio)} y1={py(0)} y2={py(slope)} stroke={ORANGE} strokeDasharray="5 5" strokeWidth="2" />
        <line x1={px(0)} x2={px(ratio)} y1={py(slope)} y2={py(slope)} stroke={ORANGE} strokeDasharray="5 5" strokeWidth="2" />
        <circle cx={px(baseRatio)} cy={py(r * baseRatio)} r="8" fill={TEAL} stroke="#fff" strokeWidth="3" />
        <circle cx={px(ratio)} cy={py(slope)} r="9" fill={ORANGE} stroke="#fff" strokeWidth="3" />
        <text x={px(ratio) + (flip ? -16 : 16)} y={py(slope) + 4} textAnchor={flip ? 'end' : 'start'} className="minimum-label off-scale">b = {fmt(slope, 2)}</text>
        <AxisLabel x={(margin.left + width - margin.right) / 2} y={height - 11}>Spread ratio SDᵧ / SDₓ</AxisLabel>
        <AxisLabel x={18} y={(margin.top + height - margin.bottom) / 2} rotate>Slope of the fitted line</AxisLabel>
      </svg>
    </div>
  )
}

// A noisier draw of the clinic than the shared sample, so the cloud stays visibly scattered at every spread.
const STRETCH_NOISE = 30

function NotebookFour() {
  const points = useMemo(() => makePatients(STRETCH_NOISE), [])
  const model = useMemo(() => regression(points), [points])
  const base = useMemo(() => {
    const sdX = sdOf(points.map((p) => p.bmi), model.xMean)
    const sdY = sdOf(points.map((p) => p.bp), model.yMean)
    return {
      sdX,
      sdY,
      zx: points.map((p) => (p.bmi - model.xMean) / sdX),
      zy: points.map((p) => (p.bp - model.yMean) / sdY),
    }
  }, [points, model])
  const [sdX, setSdX] = useState(() => clampTo(SD_X_RANGE, round1(base.sdX)))
  const [sdY, setSdY] = useState(() => clampTo(SD_Y_RANGE, round1(base.sdY)))
  const [showResiduals, setShowResiduals] = useState(false)
  const stretched = useMemo(() => points.map((p, i) => ({
    ...p,
    bmi: model.xMean + sdX * base.zx[i],
    bp: model.yMean + sdY * base.zy[i],
  })), [points, model, base, sdX, sdY])
  const fit = useMemo(() => regression(stretched), [stretched])
  const xAxis = useMemo(() => stretchAxis(model.xMean, base.zx, SD_X_RANGE[1]), [model, base])
  const yAxis = useMemo(() => stretchAxis(model.yMean, base.zy, SD_Y_RANGE[1]), [model, base])
  const r = Math.sign(model.slope) * Math.sqrt(Math.max(0, model.r2))
  const ratio = sdY / sdX
  const baseRatio = base.sdY / base.sdX
  const slopeChange = fit.slope / model.slope
  const xChange = sdX / base.sdX
  const yChange = sdY / base.sdY
  const scaleSpreads = (xFactor, yFactor) => {
    setSdX(clampTo(SD_X_RANGE, round1(base.sdX * xFactor)))
    setSdY(clampTo(SD_Y_RANGE, round1(base.sdY * yFactor)))
  }
  const insight = Math.abs(xChange - 1) < 0.02 && Math.abs(yChange - 1) < 0.02
    ? {
      tone: 'teal',
      title: 'These are the clinic’s own spreads',
      text: 'Widen the BMI spread, then the blood pressure spread, and watch which way the orange line turns.',
    }
    : Math.abs(ratio / baseRatio - 1) < 0.03
      ? {
        tone: 'teal',
        title: 'Same ratio, same slope',
        text: `Both spreads changed by about ×${fmt(yChange, 2)}, so SDᵧ / SDₓ barely moved — and neither did the slope. The cloud changed size, but every patient kept its place relative to the others.`,
      }
      : slopeChange > 1
        ? {
          tone: 'orange',
          title: `Steeper: ${fmt(slopeChange, 2)}× the clinic slope`,
          text: `Blood pressure is now spread out more relative to BMI (ratio ${fmt(ratio, 2)} vs ${fmt(baseRatio, 2)}), so each extra BMI unit lines up with a bigger change in blood pressure.`,
        }
        : {
          tone: 'navy',
          title: `Flatter: ${fmt(slopeChange, 2)}× the clinic slope`,
          text: `BMI is now spread out more relative to blood pressure (ratio ${fmt(ratio, 2)} vs ${fmt(baseRatio, 2)}), so the same rise in blood pressure is shared across more BMI units.`,
        }
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[3]} eyebrow="Notebook 04 · 5 minutes">
        Take the same patients and stretch or squeeze each variable. Every patient keeps its place in the pack, so the correlation never changes — yet the least-squares slope does. Find out which spread pushes it which way.
      </NotebookHeader>

      <div className="diagnostic-grid">
        <Rise className="panel chart-panel diagnostic" delay={1}>
          <div className="panel-topline compact">
            <div><span className="panel-kicker">Stretched sample</span><h3>ŷ = {fmt(fit.intercept)} + {fmt(fit.slope, 2)} × BMI</h3></div>
            <span className="formula-chip">axes fixed at the widest spreads</span>
          </div>
          <ScatterPlot
            points={stretched}
            model={model}
            userLine={{ intercept: fit.intercept, slope: fit.slope }}
            showBest
            showResiduals={showResiduals}
            xDomain={xAxis.domain}
            yDomain={yAxis.domain}
            xTicks={xAxis.ticks}
            yTicks={yAxis.ticks}
            compact
          />
          <div className="legend-row">
            <span><i className="dot patient" /> 48 patients, rescaled</span>
            <span><i className="line yours" /> Least-squares line now</span>
            <span><i className="line best" /> Clinic sample’s line</span>
            {showResiduals && <span><i className="line residual" /> Residuals</span>}
          </div>
        </Rise>
        <Rise className="panel chart-panel diagnostic" delay={2}>
          <div className="panel-topline compact">
            <div><span className="panel-kicker">Where the slope comes from</span><h3>Slope versus spread ratio</h3></div>
            <span className="formula-chip">b = r × SDᵧ / SDₓ</span>
          </div>
          <SlopeRatioPlot r={r} ratio={ratio} baseRatio={baseRatio} />
          <div className="legend-row">
            <span><i className="line profile" /> Every possible slope at r = {fmt(r, 2)}</span>
            <span><i className="dot minimum-dot" /> Clinic sample</span>
            <span><i className="dot current-dot" /> Your spreads</span>
          </div>
        </Rise>
      </div>

      <div className="dual-controls">
        <Rise className="panel controls-panel" delay={3}>
          <span className="panel-kicker">Set the spreads</span>
          <Slider label="SD of BMI (SDₓ)" value={sdX} min={SD_X_RANGE[0]} max={SD_X_RANGE[1]} step={0.1} onChange={setSdX} suffix=" kg/m²" />
          <Slider label="SD of systolic BP (SDᵧ)" value={sdY} min={SD_Y_RANGE[0]} max={SD_Y_RANGE[1]} step={0.1} onChange={setSdY} suffix=" mmHg" />
          <div className="preset-grid">
            <button className="secondary-button" onClick={() => scaleSpreads(1.5, 1)}>BMI spread ×1.5</button>
            <button className="secondary-button" onClick={() => scaleSpreads(1, 1.5)}>BP spread ×1.5</button>
            <button className="secondary-button" onClick={() => scaleSpreads(1.5, 1.5)}>Both ×1.5</button>
            <button className="secondary-button" onClick={() => scaleSpreads(1, 1)}><RefreshCw size={15} aria-hidden="true" /> Clinic sample</button>
          </div>
          <label className="toggle-row">
            <input type="checkbox" checked={showResiduals} onChange={(event) => setShowResiduals(event.target.checked)} />
            <span className="toggle" />
            Show residuals
          </label>
        </Rise>
        <div className="stack">
          <Rise className="metric-grid" delay={4}>
            <Metric label="Slope (b)" value={fmt(fit.slope, 2)} note={`${fmt(slopeChange, 2)}× the clinic slope`} accent={ORANGE} />
            <Metric label="SDᵧ / SDₓ" value={fmt(ratio, 2)} note={`clinic: ${fmt(baseRatio, 2)}`} accent={NAVY} />
            <Metric label="Correlation r" value={fmt(Math.sign(fit.slope) * Math.sqrt(Math.max(0, fit.r2)), 2)} note="unchanged by stretching" accent={TEAL} />
          </Rise>
          <Rise delay={5}>
            <Callout icon={Scaling} tone={insight.tone} title={insight.title}>{insight.text}</Callout>
          </Rise>
        </div>
      </div>

      <Rise className="formula-panel panel">
        <div><span className="panel-kicker">The rule behind it</span><h3>Slope = r × SDᵧ / SDₓ</h3><p>Stretching a variable changes its SD but not r, so the slope moves exactly in step with the spread ratio. A wider cloud is not a weaker trend.</p></div>
        <div className="formula-comparison">
          <div><small>From the formula</small><strong>{fmt(r, 2)} × {fmt(sdY)} / {fmt(sdX)} = {fmt(r * ratio, 2)}</strong></div>
          <ArrowRight size={20} />
          <div><small>From least squares</small><strong>linregress slope = {fmt(fit.slope, 2)}</strong></div>
          <span className="match-badge"><Check size={14} /> Match</span>
        </div>
      </Rise>
    </section>
  )
}

function NotebookFive() {
  const [scenario, setScenario] = useState('linear')
  const [outlier, setOutlier] = useState(false)
  const [noise, setNoise] = useState(10)
  const points = useMemo(() => makePatients(noise, 2, scenario, outlier), [noise, scenario, outlier])
  const model = useMemo(() => regression(points), [points])
  const insight = scenario === 'curved'
    ? 'The residuals bend into a U. R² can look respectable even when a straight line is the wrong shape.'
    : outlier
      ? 'One extreme patient pulls the slope. Investigate first; never delete a point just because it is inconvenient.'
      : 'A healthy residual plot looks like an unstructured cloud centered around zero.'
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[4]} eyebrow="Notebook 05 · 5 minutes">
        A score is only a summary. Change the scenario, inspect the residuals, and decide whether a straight line deserves your trust.
      </NotebookHeader>

      <Rise className="scenario-bar panel" delay={1}>
        <div className="segmented" role="group" aria-label="Relationship scenario" style={{ '--seg-index': scenario === 'curved' ? 1 : 0 }}>
          <button className={scenario === 'linear' ? 'active' : ''} aria-pressed={scenario === 'linear'} onClick={() => setScenario('linear')}>Linear</button>
          <button className={scenario === 'curved' ? 'active' : ''} aria-pressed={scenario === 'curved'} onClick={() => setScenario('curved')}>Curved</button>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={outlier} onChange={(event) => setOutlier(event.target.checked)} />
          <span className="toggle" />
          Add an extreme patient
        </label>
        <div className="scenario-noise">
          <span>Noise</span>
          <input type="range" aria-label="Noise" min="4" max="20" step="1" value={noise} style={rangeFill(noise, 4, 20)} onChange={(event) => setNoise(Number(event.target.value))} />
          <strong>{noise}</strong>
        </div>
      </Rise>

      <div className="diagnostic-grid">
        <Rise className="panel chart-panel diagnostic" delay={2}>
          <div className="panel-topline compact"><div><span className="panel-kicker">Observed vs fitted</span><h3>Regression line</h3></div><span className="formula-chip">ŷ = {fmt(model.intercept)} + {fmt(model.slope, 2)}x</span></div>
          <ScatterPlot points={points} model={model} userLine={{ intercept: model.intercept, slope: model.slope }} compact />
        </Rise>
        <Rise className="panel chart-panel diagnostic" delay={3}>
          <div className="panel-topline compact"><div><span className="panel-kicker">Pattern check</span><h3>Residual plot</h3></div><span className={`status-chip ${scenario === 'curved' || outlier ? 'warn' : ''}`}>{scenario === 'curved' || outlier ? 'Inspect' : 'Looks healthy'}</span></div>
          <ResidualPlot points={points} model={model} />
        </Rise>
      </div>

      <Rise className="diagnostic-summary">
        <div className="metric-grid">
          <Metric label="R²" value={fmt(model.r2, 2)} note="variance explained" accent="#8b5fa4" />
          <Metric label="RMSE" value={`${fmt(model.rmse)} mmHg`} note="typical prediction miss" accent={ORANGE} />
          <Metric label="Slope" value={fmt(model.slope, 2)} note="mmHg per BMI unit" accent={TEAL} />
        </div>
        <Callout icon={CircleAlert} tone={scenario === 'curved' || outlier ? 'purple' : 'teal'} title="Your diagnostic read">{insight}</Callout>
      </Rise>
    </section>
  )
}

function NotebookSix({ points, model }) {
  const [bmi, setBmi] = useState(28)
  const [showCode, setShowCode] = useState(false)
  const prediction = model.intercept + model.slope * bmi
  const low = prediction - 2 * model.rmse
  const high = prediction + 2 * model.rmse
  const extrapolating = bmi < 17 || bmi > 42
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[5]} eyebrow="Notebook 06 · 4 minutes">
        Turn the fitted equation into a patient prediction, then check the uncertainty and whether the input stays inside the observed data range.
      </NotebookHeader>

      <Rise className="prediction-hero panel" delay={1}>
        <div className="prediction-control">
          <span className="panel-kicker">Patient input</span>
          <h3>What is your patient’s BMI?</h3>
          <div className="number-input-wrap">
            <input aria-label="Patient BMI" type="number" min="0" max="70" step="1" value={bmi} onChange={(event) => setBmi(Number(event.target.value))} />
            <span>kg/m²</span>
          </div>
          <Slider label="BMI" value={bmi} min={10} max={60} step={1} onChange={setBmi} />
          <div className="range-label"><span>Observed clinic range</span><strong>17–42</strong></div>
          {extrapolating ? (
            <Callout icon={CircleAlert} tone="red" title="Outside the evidence">
              The line can calculate this value, but the clinic sample contains no patients here. Treat it as extrapolation, not a trustworthy estimate.
            </Callout>
          ) : (
            <Callout icon={Check} tone="teal" title="Inside the observed range">
              This BMI is represented in the sample, so the prediction stays within the evidence used to fit the line.
            </Callout>
          )}
        </div>
        <div className="prediction-result">
          <div className="result-topline"><span>Predicted systolic BP</span><span className="formula-chip">ŷ = a + bx</span></div>
          <strong className="big-result">{fmt(prediction, 0)}<small>mmHg</small></strong>
          <p>Rough patient range: <strong>{fmt(low, 0)}–{fmt(high, 0)} mmHg</strong></p>
          <div className="range-track">
            <span className="range-fill" />
            <i style={{ left: '50%' }} />
          </div>
          <div className="equation-breakdown">
            <span>{fmt(model.intercept)}</span><em>+</em><span>{fmt(model.slope, 2)}</span><em>×</em><span>{bmi}</span><em>=</em><strong>{fmt(prediction, 1)}</strong>
          </div>
        </div>
      </Rise>

      <div className="two-column code-section">
        <Rise className="panel chart-panel prediction-chart" delay={1}>
          <div className="panel-topline compact"><div><span className="panel-kicker">Where the prediction sits</span><h3>Clinic sample</h3></div></div>
          <ScatterPlot points={points} model={model} userLine={{ intercept: model.intercept, slope: model.slope }} predictionX={bmi} compact />
        </Rise>
        <Rise className="panel code-card" delay={2}>
          <div className="panel-topline">
            <div><span className="panel-kicker">Python in practice</span><h3>Three-step recipe</h3></div>
            <button className="code-toggle" aria-pressed={showCode} onClick={() => setShowCode((value) => !value)}><Code2 size={16} />{showCode ? 'Hide code' : 'Show code'}</button>
          </div>
          {showCode ? (
            <pre className="swap-in"><code><span className="code-comment"># 1. Fit</span>{'\n'}fit = stats.linregress(bmi, systolic_bp){'\n\n'}<span className="code-comment"># 2. Predict + inspect errors</span>{'\n'}predicted = fit.intercept + fit.slope * bmi{'\n'}residual = systolic_bp - predicted{'\n\n'}<span className="code-comment"># 3. Plot both views</span>{'\n'}plt.scatter(bmi, systolic_bp){'\n'}plt.plot(bmi, predicted)</code></pre>
          ) : (
            <ol className="recipe-list swap-in">
              <li><span>01</span><div><strong>Fit</strong><p>Estimate the slope and intercept.</p></div></li>
              <li><span>02</span><div><strong>Predict</strong><p>Calculate fitted values and residuals.</p></div></li>
              <li><span>03</span><div><strong>Plot</strong><p>Inspect the line and residual pattern.</p></div></li>
            </ol>
          )}
        </Rise>
      </div>
    </section>
  )
}

// Notebook 07 uses a small dose–response sample whose true shape saturates (an Emax curve).
const DOSES = [0, 2.5, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100]
const TRUE_EMAX = 32
const TRUE_ED50 = 14
const emaxCurve = (emax, ed50) => (dose) => (emax * dose) / (ed50 + dose)

function makeDoseResponse(noise = 3) {
  return DOSES.map((dose, i) => {
    const wave = Math.sin(i * 12.9898 + 7.31) * 43758.5453
    const wave2 = Math.cos(i * 6.733 + 2.4) * 13631.71
    const jitter = (wave - Math.floor(wave)) - (wave2 - Math.floor(wave2))
    return { x: dose, y: emaxCurve(TRUE_EMAX, TRUE_ED50)(dose) + jitter * noise * 1.2, id: i + 1 }
  })
}

// Goodness of fit for any prediction function, so both models are scored identically.
function scoreFit(points, predict) {
  const yMean = points.reduce((sum, p) => sum + p.y, 0) / points.length
  const residuals = points.map((p) => p.y - predict(p.x))
  const ssr = residuals.reduce((sum, value) => sum + value ** 2, 0)
  const sst = points.reduce((sum, p) => sum + (p.y - yMean) ** 2, 0)
  return { residuals, ssr, r2: 1 - ssr / sst, rmse: Math.sqrt(ssr / points.length) }
}

// Straight line: least squares has a closed-form answer.
function fitLine(points) {
  const n = points.length
  const xMean = points.reduce((sum, p) => sum + p.x, 0) / n
  const yMean = points.reduce((sum, p) => sum + p.y, 0) / n
  const slope = points.reduce((sum, p) => sum + (p.x - xMean) * (p.y - yMean), 0)
    / points.reduce((sum, p) => sum + (p.x - xMean) ** 2, 0)
  const intercept = yMean - slope * xMean
  const predict = (x) => intercept + slope * x
  return { intercept, slope, predict, ...scoreFit(points, predict) }
}

// Emax curve: no closed form, so search. For a fixed ED50 the best Emax is a simple ratio,
// which leaves a one-dimensional search over ED50 (coarse grid, then golden-section refinement).
function fitEmax(points) {
  const bestEmax = (ed50) => {
    const f = points.map((p) => p.x / (ed50 + p.x))
    return points.reduce((sum, p, i) => sum + p.y * f[i], 0) / f.reduce((sum, v) => sum + v * v, 0)
  }
  const ssrAt = (logEd50) => {
    const ed50 = Math.exp(logEd50)
    return scoreFit(points, emaxCurve(bestEmax(ed50), ed50)).ssr
  }
  const grid = Array.from({ length: 61 }, (_, i) => Math.log(0.5) + (i / 60) * (Math.log(1000) - Math.log(0.5)))
  const best = grid.reduce((bestIndex, value, i) => (ssrAt(value) < ssrAt(grid[bestIndex]) ? i : bestIndex), 0)
  let lo = grid[Math.max(0, best - 1)]
  let hi = grid[Math.min(grid.length - 1, best + 1)]
  const golden = (Math.sqrt(5) - 1) / 2
  for (let step = 0; step < 50; step++) {
    const a = hi - golden * (hi - lo)
    const b = lo + golden * (hi - lo)
    if (ssrAt(a) < ssrAt(b)) hi = b
    else lo = a
  }
  const ed50 = Math.exp((lo + hi) / 2)
  const emax = bestEmax(ed50)
  const predict = emaxCurve(emax, ed50)
  return { emax, ed50, predict, ...scoreFit(points, predict) }
}

function FitPlot({ points, fits, residualFit, xDomain, yDomain, xTicks, yTicks, observed, markerX, label, height = 360 }) {
  const clipId = `fit-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const width = 720
  const margin = { top: 24, right: 22, bottom: 55, left: 68 }
  const px = (value) => margin.left + ((value - xDomain[0]) / (xDomain[1] - xDomain[0])) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) * (height - margin.top - margin.bottom)
  const pathFor = (predict) => Array.from({ length: 121 }, (_, i) => {
    const x = xDomain[0] + (i / 120) * (xDomain[1] - xDomain[0])
    return `${i ? 'L' : 'M'} ${px(x).toFixed(1)} ${py(predict(x)).toFixed(1)}`
  }).join(' ')
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <rect x={margin.left} y={margin.top} width={width - margin.left - margin.right} height={height - margin.top - margin.bottom} />
          </clipPath>
        </defs>
        {observed && (
          <>
            <rect x={px(observed[0])} y={margin.top} width={px(observed[1]) - px(observed[0])} height={height - margin.top - margin.bottom} className="observed-band" />
            <text x={px(observed[1]) + 10} y={margin.top + 18} className="minimum-label off-scale">beyond the data →</text>
          </>
        )}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={py(tick)} y2={py(tick)} className={tick === 0 ? 'zero-line' : 'grid-line'} />
            <text x={margin.left - 13} y={py(tick) + 4} textAnchor="end" className="tick-label">{tick}</text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={px(tick)} x2={px(tick)} y1={margin.top} y2={height - margin.bottom} className="grid-line vertical" />
            <text x={px(tick)} y={height - margin.bottom + 25} textAnchor="middle" className="tick-label">{tick}</text>
          </g>
        ))}
        <g clipPath={`url(#${clipId})`}>
          {residualFit && points.map((p) => (
            <line key={`r-${p.id}`} x1={px(p.x)} x2={px(p.x)} y1={py(p.y)} y2={py(residualFit.predict(p.x))} stroke={RED} strokeWidth="1.6" opacity=".6" />
          ))}
          {fits.map((fit) => (
            <path key={fit.key} d={pathFor(fit.predict)} fill="none" stroke={fit.color} strokeWidth={4} strokeLinecap="round" />
          ))}
          {markerX !== undefined && (
            <>
              <line x1={px(markerX)} x2={px(markerX)} y1={margin.top} y2={height - margin.bottom} stroke={INK} strokeDasharray="5 5" strokeWidth="1.5" opacity=".5" />
              {fits.map((fit) => (
                <circle key={fit.key} cx={px(markerX)} cy={py(fit.predict(markerX))} r="8" fill={fit.color} stroke="#fff" strokeWidth="3" />
              ))}
            </>
          )}
          {points.map((p) => (
            <circle key={p.id} cx={px(p.x)} cy={py(p.y)} r="5.5" fill={INK} opacity=".8" stroke="#fff" strokeWidth="1.4" />
          ))}
        </g>
        <AxisLabel x={(margin.left + width - margin.right) / 2} y={height - 11}>Dose (mg)</AxisLabel>
        <AxisLabel x={18} y={(margin.top + height - margin.bottom) / 2} rotate>Drop in systolic BP (mmHg)</AxisLabel>
      </svg>
    </div>
  )
}

// Residuals against dose, with a running average that exposes any leftover shape.
function FitResidualPlot({ points, residuals, color, limit, label }) {
  const width = 720
  const height = 240
  const margin = { top: 18, right: 22, bottom: 50, left: 68 }
  const px = (value) => margin.left + (value / 100) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - ((value + limit) / (2 * limit)) * (height - margin.top - margin.bottom)
  const trend = points.map((p, i) => {
    const window = residuals.slice(Math.max(0, i - 2), i + 3)
    return `${i ? 'L' : 'M'} ${px(p.x).toFixed(1)} ${py(window.reduce((sum, v) => sum + v, 0) / window.length).toFixed(1)}`
  }).join(' ')
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {[-limit, -limit / 2, 0, limit / 2, limit].map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={py(tick)} y2={py(tick)} className={tick === 0 ? 'zero-line' : 'grid-line'} />
            <text x={margin.left - 13} y={py(tick) + 4} textAnchor="end" className="tick-label">{tick}</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((tick) => (
          <text key={tick} x={px(tick)} y={height - margin.bottom + 22} textAnchor="middle" className="tick-label">{tick}</text>
        ))}
        <path d={trend} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".4" />
        {points.map((p, i) => (
          <circle key={p.id} cx={px(p.x)} cy={py(residuals[i])} r="5.5" fill={color} opacity=".88" stroke="#fff" strokeWidth="1.4" />
        ))}
        <AxisLabel x={(margin.left + width - margin.right) / 2} y={height - 8}>Dose (mg)</AxisLabel>
        <AxisLabel x={18} y={(margin.top + height - margin.bottom) / 2} rotate>Residual</AxisLabel>
      </svg>
    </div>
  )
}

const CURVE = TEAL

function NotebookSeven() {
  const [noise, setNoise] = useState(3)
  const [showResiduals, setShowResiduals] = useState(true)
  const [dose, setDose] = useState(60)
  const points = useMemo(() => makeDoseResponse(noise), [noise])
  const line = useMemo(() => fitLine(points), [points])
  const curve = useMemo(() => fitEmax(points), [points])
  // Shared residual scale so the two residual plots can be compared by eye.
  const residualLimit = Math.max(5, Math.ceil(Math.max(...[...line.residuals, ...curve.residuals].map(Math.abs)) / 5) * 5)
  const linePrediction = line.predict(dose)
  const curvePrediction = curve.predict(dose)
  const beyond = dose > 100
  const lineEquation = `ŷ = ${fmt(line.intercept)} + ${fmt(line.slope, 3)} × dose`
  const curveEquation = `ŷ = ${fmt(curve.emax)} × dose / (${fmt(curve.ed50)} + dose)`
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[6]} eyebrow="Notebook 07 · 6 minutes">
        Not every relationship is a straight line. Fit one small dose–response dataset two ways — a straight line and a curve that levels off — and compare how faithfully each follows the data.
      </NotebookHeader>

      <Rise className="data-strip panel" delay={1}>
        <div className="data-strip-title"><BarChart3 size={18} /><strong>The dataset: 16 patients, one dose each</strong><span>dose → drop in systolic BP</span></div>
        <div className="table-wrap">
          <table className="dataset-table">
            <thead><tr><th scope="col">Patient</th>{points.map((p) => <th key={p.id} scope="col">#{String(p.id).padStart(2, '0')}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">Dose (mg)</th>{points.map((p) => <td key={p.id}>{p.x}</td>)}</tr>
              <tr><th scope="row">BP drop (mmHg)</th>{points.map((p) => <td key={p.id}>{fmt(p.y)}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </Rise>

      <Rise className="scenario-bar panel" delay={2}>
        <span className="panel-kicker">Same 16 points, two models</span>
        <label className="toggle-row">
          <input type="checkbox" checked={showResiduals} onChange={(event) => setShowResiduals(event.target.checked)} />
          <span className="toggle" />
          Show residuals
        </label>
        <div className="scenario-noise">
          <span>Noise</span>
          <input type="range" aria-label="Noise" min="0" max="8" step="0.5" value={noise} style={rangeFill(noise, 0, 8)} onChange={(event) => setNoise(Number(event.target.value))} />
          <strong>{noise}</strong>
        </div>
      </Rise>

      <div className="diagnostic-grid">
        <Rise className="panel chart-panel diagnostic" delay={2}>
          <div className="panel-topline compact">
            <div><span className="panel-kicker">Linear regression</span><h3>A straight line</h3></div>
            <span className="formula-chip">{lineEquation}</span>
          </div>
          <FitPlot
            points={points}
            fits={[{ key: 'line', predict: line.predict, color: ORANGE }]}
            residualFit={showResiduals ? line : null}
            xDomain={[0, 100]}
            yDomain={[-5, 40]}
            xTicks={[0, 25, 50, 75, 100]}
            yTicks={[0, 10, 20, 30, 40]}
            label="Dose–response data with a straight-line fit"
          />
          <div className="residual-heading">
            <span className="panel-kicker">Residuals</span>
            <span className="status-chip warn">Arched pattern</span>
          </div>
          <FitResidualPlot points={points} residuals={line.residuals} color={ORANGE} limit={residualLimit} label="Residuals of the straight-line fit" />
          <div className="mini-metrics">
            <Metric label="R²" value={fmt(line.r2, 3)} note="variance explained" accent={ORANGE} />
            <Metric label="RMSE" value={`${fmt(line.rmse)} mmHg`} note="typical miss" accent={ORANGE} />
          </div>
        </Rise>

        <Rise className="panel chart-panel diagnostic" delay={3}>
          <div className="panel-topline compact">
            <div><span className="panel-kicker">Nonlinear regression</span><h3>A saturating curve</h3></div>
            <span className="formula-chip">{curveEquation}</span>
          </div>
          <FitPlot
            points={points}
            fits={[{ key: 'curve', predict: curve.predict, color: CURVE }]}
            residualFit={showResiduals ? curve : null}
            xDomain={[0, 100]}
            yDomain={[-5, 40]}
            xTicks={[0, 25, 50, 75, 100]}
            yTicks={[0, 10, 20, 30, 40]}
            label="Dose–response data with an Emax curve fit"
          />
          <div className="residual-heading">
            <span className="panel-kicker">Residuals</span>
            <span className="status-chip">Random scatter</span>
          </div>
          <FitResidualPlot points={points} residuals={curve.residuals} color={CURVE} limit={residualLimit} label="Residuals of the curve fit" />
          <div className="mini-metrics">
            <Metric label="R²" value={fmt(curve.r2, 3)} note="variance explained" accent={CURVE} />
            <Metric label="RMSE" value={`${fmt(curve.rmse)} mmHg`} note="typical miss" accent={CURVE} />
          </div>
        </Rise>
      </div>

      <Rise>
        <Callout icon={CircleAlert} tone="purple" title="A high R² is not the same as the right shape">
          The line still scores R² = {fmt(line.r2, 2)}, yet its residuals arch: it overshoots at 0 mg (predicting a {fmt(line.intercept)} mmHg drop with no drug at all), undershoots in the middle, and overshoots again at the top. The curve’s residuals bounce around zero with no pattern. Slide the noise down to 0 — the curve’s misses vanish, but the line’s don’t, because they come from the wrong shape, not from randomness.
        </Callout>
      </Rise>

      <div className="two-column">
        <Rise className="panel chart-panel" delay={1}>
          <div className="panel-topline">
            <div><span className="panel-kicker">Why the shape matters</span><h3>Predict with both models</h3></div>
            <span className={`status-chip ${beyond ? 'warn' : ''}`}>{beyond ? 'Extrapolating' : 'Inside the data'}</span>
          </div>
          <FitPlot
            points={points}
            fits={[{ key: 'line', predict: line.predict, color: ORANGE }, { key: 'curve', predict: curve.predict, color: CURVE }]}
            xDomain={[0, 200]}
            yDomain={[-5, 65]}
            xTicks={[0, 50, 100, 150, 200]}
            yTicks={[0, 20, 40, 60]}
            observed={[0, 100]}
            markerX={dose}
            height={400}
            label="Both fits extended to 200 mg with the chosen dose marked"
          />
          <div className="legend-row">
            <span><i className="dot patient" /> Patients</span>
            <span><i className="line yours" /> Straight line</span>
            <span><i className="line curve" /> Curve</span>
            <span><i className="swatch observed" /> Observed doses (0–100 mg)</span>
          </div>
          <div className="metric-grid compare-metrics">
            <Metric label="Line predicts" value={`${fmt(linePrediction)} mmHg`} note="keeps rising forever" accent={ORANGE} />
            <Metric label="Curve predicts" value={`${fmt(curvePrediction)} mmHg`} note={`levels off near ${fmt(curve.emax)}`} accent={CURVE} />
            <Metric label="Disagreement" value={`${fmt(Math.abs(linePrediction - curvePrediction))} mmHg`} note="gap between models" accent={RED} />
          </div>
        </Rise>
        <div className="stack">
          <Rise className="panel controls-panel" delay={2}>
            <span className="panel-kicker">Choose a dose</span>
            <Slider label="Dose" value={dose} min={0} max={200} step={5} onChange={setDose} suffix=" mg" />
            <div className="range-label"><span>Observed range</span><strong>0–100 mg</strong></div>
          </Rise>
          <Rise delay={3}>
            {beyond ? (
              <Callout icon={CircleAlert} tone="red" title="Beyond the data, the models diverge">
                The line assumes every extra milligram adds the same {fmt(line.slope, 2)} mmHg, so it keeps climbing. The curve says the drug’s effect saturates near {fmt(curve.emax)} mmHg. No patient received more than 100 mg, so the data can’t settle it — but the curve’s shape matches how drug effects usually behave.
              </Callout>
            ) : (
              <Callout icon={Check} tone="teal" title="Even inside the data, shape matters">
                The models disagree most at low and high doses, exactly where the line can’t bend to follow the data. Try 0 mg and 100 mg.
              </Callout>
            )}
          </Rise>
        </div>
      </div>

      <Rise className="data-strip panel">
        <div className="data-strip-title"><Spline size={18} /><strong>Side by side</strong><span>fitted to the same 16 patients</span></div>
        <div className="table-wrap">
          <table className="compare-table">
            <thead><tr><th scope="col" /><th scope="col"><i className="key-dot" style={{ background: ORANGE }} />Linear regression</th><th scope="col"><i className="key-dot" style={{ background: CURVE }} />Nonlinear regression</th></tr></thead>
            <tbody>
              <tr><th scope="row">Fitted model</th><td><code>{lineEquation}</code></td><td><code>{curveEquation}</code></td></tr>
              <tr><th scope="row">What the parameters mean</th><td>Slope: {fmt(line.slope, 3)} mmHg per mg, the same at every dose</td><td>Emax: largest possible drop · ED50: dose giving half of it</td></tr>
              <tr><th scope="row">How it’s fitted</th><td>One-step formula for the least-squares line</td><td>Iterative search for the least-squares curve, from a starting guess</td></tr>
              <tr><th scope="row">R² · RMSE</th><td>{fmt(line.r2, 3)} · {fmt(line.rmse)} mmHg</td><td>{fmt(curve.r2, 3)} · {fmt(curve.rmse)} mmHg</td></tr>
              <tr><th scope="row">Residuals</th><td>Arch — leftover structure</td><td>Random scatter around zero</td></tr>
              <tr><th scope="row">Beyond 100 mg</th><td>Rises without limit</td><td>Plateaus near Emax</td></tr>
            </tbody>
          </table>
        </div>
      </Rise>

      <div className="two-column code-section">
        <Rise className="panel code-card">
          <div className="panel-topline compact"><div><span className="panel-kicker">Python in practice</span><h3>Fit both, compare residuals</h3></div></div>
          <pre><code><span className="code-comment"># 1. Straight line: closed-form least squares</span>{'\n'}line = stats.linregress(dose, bp_drop){'\n\n'}<span className="code-comment"># 2. Curve: iterative least squares from a guess</span>{'\n'}def emax_model(dose, emax, ed50):{'\n'}    return emax * dose / (ed50 + dose){'\n\n'}(emax, ed50), _ = curve_fit(emax_model, dose, bp_drop,{'\n'}                             p0=[30, 10]){'\n\n'}<span className="code-comment"># 3. Judge both the same way</span>{'\n'}line_resid = bp_drop - (line.intercept + line.slope * dose){'\n'}curve_resid = bp_drop - emax_model(dose, emax, ed50)</code></pre>
        </Rise>
        <Rise delay={1}>
          <Callout icon={Sparkles} tone="navy" title="What makes a regression “nonlinear”?">
            It’s about the parameters, not the picture. A polynomial like ŷ = a + b·x + c·x² draws a curve, but it is still linear regression: each coefficient simply multiplies a term, so one formula solves it. In the Emax model, ED50 sits inside a fraction, so no formula exists — software must search iteratively, and a sensible starting guess matters.
          </Callout>
        </Rise>
      </div>
    </section>
  )
}

const heroPoints = [[83,302],[116,283],[140,275],[165,260],[198,235],[215,242],[242,204],[276,205],[305,164],[328,177],[357,133],[391,126],[424,96],[448,111]]
const heroResiduals = [[140,275,278],[215,242,233],[328,177,164],[391,126,125]]

// Shelf sketch for notebook 07: points on a saturating curve, the straight line that misses it, and the curve that follows it.
const coverDoses = [0, 5, 10, 15, 22, 30, 40, 55, 70, 85, 100]
const coverX = (dose) => 16 + dose * 2.88
const coverY = (drop) => 108 - drop * 2.75
const coverSample = coverDoses.map((dose, i) => ({ x: dose, y: emaxCurve(TRUE_EMAX, TRUE_ED50)(dose) + [0, 1.4, -1.2, 0.8, -0.6, 1, -1, 0.6, -0.8, 0.5, -0.3][i], id: i }))
const coverFit = fitLine(coverSample)
const coverCurvePoints = coverSample.map((p) => [coverX(p.x), coverY(p.y)])
const coverLine = { x1: coverX(0), y1: coverY(coverFit.predict(0)), x2: coverX(100), y2: coverY(coverFit.predict(100)) }
const coverCurvePath = Array.from({ length: 41 }, (_, i) => `${i ? 'L' : 'M'} ${coverX(i * 2.5).toFixed(1)} ${coverY(emaxCurve(TRUE_EMAX, TRUE_ED50)(i * 2.5)).toFixed(1)}`).join(' ')

// Moves the card's glass highlight to follow the pointer.
const trackPointer = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

function Overview({ onOpen }) {
  return (
    <div className="overview">
      <section className="hero" aria-labelledby="hero-title">
        <Rise className="hero-copy">
          <div className="hero-badge"><BookOpen size={15} /> Interactive lesson · 35 minutes</div>
          <KineticText
            as="h1"
            id="hero-title"
            lines={[{ text: 'Build the line.' }, { text: 'Trust it wisely.', accent: true }]}
          />
          <p>Seven visual notebooks turn linear regression from an equation into something you can see, tune, explain, challenge, and use — then show when a straight line isn’t enough.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onOpen(0)}>Open notebook 01 <ArrowRight size={18} /></button>
            <a className="ghost-button" href="#notebooks">Browse notebooks <ArrowDown size={16} /></a>
          </div>
          <dl className="hero-stats">
            <div><dt>Notebooks</dt><dd>{String(NOTEBOOK_COUNT).padStart(2, '0')}</dd></div>
            <div><dt>Simulated patients</dt><dd>48</dd></div>
            <div><dt>Model</dt><dd>ŷ = a + bx</dd></div>
          </dl>
        </Rise>
        <div className="hero-visual" aria-hidden="true">
          <div className="graph-paper">
            <svg viewBox="0 0 520 390">
              <line className="hero-line" x1="58" y1="330" x2="472" y2="75" stroke={ORANGE} strokeWidth="8" strokeLinecap="round" />
              {heroPoints.map(([x, y], i) => <circle key={i} className="hero-point" style={{ '--i': i }} cx={x} cy={y} r={i % 3 === 0 ? 8 : 6} fill={INK} opacity={.78} />)}
              {heroResiduals.map(([x, y, y2], i) => <line key={i} className="hero-residual" style={{ '--i': i }} x1={x} x2={x} y1={y} y2={y2} stroke={RED} strokeWidth="3" />)}
            </svg>
            <div className="equation-card">ŷ = <span>a</span> + <strong>b</strong>x</div>
            <div className="annotation">Every point tells a story.</div>
          </div>
        </div>
      </section>

      <section className="shelf" id="notebooks" aria-labelledby="shelf-title">
        <Rise className="shelf-heading">
          <p className="eyebrow">The notebooks</p>
          <KineticText as="h2" id="shelf-title" lines={[{ text: 'From scatter to prediction,' }, { text: 'one idea at a time.', accent: true }]} />
        </Rise>
        <div className="notebook-shelf">
          {notebookMeta.map((item, index) => {
            const Icon = item.icon
            return (
              <Rise key={item.number} className={`shelf-item${index === 0 ? ' feature' : ''}${item.extension ? ' wide' : ''}`} delay={index}>
                <button className="cover-card" style={{ '--cover': item.color }} data-number={item.number} onClick={() => onOpen(index)} onPointerMove={trackPointer}>
                  <span className="cover-top">
                    <span className="cover-number">{item.number}</span>
                    {index === 0 && <span className="cover-tag">Start here</span>}
                  </span>
                  <span className="cover-icon"><Icon size={21} /></span>
                  {index === 0 && (
                    <svg className="cover-spark" viewBox="0 0 220 90" aria-hidden="true">
                      <line x1="10" y1="80" x2="210" y2="12" />
                      {[[24,70],[46,66],[62,58],[84,60],[102,46],[124,44],[140,38],[162,30],[184,26],[200,16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
                    </svg>
                  )}
                  {item.extension && (
                    <svg className="cover-curve" viewBox="0 0 320 120" aria-hidden="true">
                      <line className="cover-curve-line" x1={coverLine.x1} y1={coverLine.y1} x2={coverLine.x2} y2={coverLine.y2} />
                      <path className="cover-curve-path" d={coverCurvePath} pathLength="1" />
                      {coverCurvePoints.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
                    </svg>
                  )}
                  <span className="cover-kicker">{item.kicker}</span>
                  <strong>{item.title}</strong>
                  <small>{item.short}</small>
                  <span className="cover-link">Open notebook <ArrowRight size={15} /></span>
                </button>
              </Rise>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function App() {
  const [active, setActive] = useState(-1)
  const [noise, setNoise] = useState(10)
  const [sample, setSample] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const points = useMemo(() => makePatients(noise, sample), [noise, sample])
  const model = useMemo(() => regression(points), [points])
  const openNotebook = (index) => {
    setActive(index)
    scrollToTop()
  }
  const goOverview = () => {
    setActive(-1)
    scrollToTop()
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keep the active notebook chip visible in the horizontally scrolling mobile nav.
  const activeNavRef = useRef(null)
  useEffect(() => {
    const button = activeNavRef.current
    const nav = button?.parentElement
    if (nav && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = button.offsetLeft - 12
  }, [active])

  useEffect(() => {
    document.title = active < 0
      ? 'Linear Regression Lab'
      : `${notebookMeta[active].number} · ${notebookMeta[active].title} — Linear Regression Lab`
  }, [active])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`topbar${scrolled ? ' is-scrolled' : ''}`}>
        <button className="brand" onClick={goOverview} aria-label="Return to overview">
          <span className="brand-mark"><LineChart size={20} /></span>
          <span><strong>Linear Regression</strong><small>Visual Lab</small></span>
        </button>
        <div className="topbar-meta"><span className="live-dot" /> {notebookMeta[active]?.topic ?? 'BMI → systolic BP'}</div>
        <button className="outline-button" onClick={() => openNotebook(active < 0 ? 0 : (active + 1) % NOTEBOOK_COUNT)}>
          <span className="button-label">{active < 0 ? 'Start lesson' : active === LAST_NOTEBOOK ? 'Start over' : 'Next notebook'}</span> <ArrowRight size={16} aria-hidden="true" />
        </button>
        <span className="scroll-progress" aria-hidden="true" />
      </header>

      <main id="main" tabIndex={-1}>
        {active < 0 ? <Overview onOpen={openNotebook} /> : (
          <div className="lesson-layout">
            <aside className="side-nav">
              <button className="back-link" onClick={goOverview}><ChevronLeft size={16} /> Overview</button>
              <p className="side-label" id="notebook-nav-label">Seven notebooks</p>
              <nav aria-labelledby="notebook-nav-label">
                <span className="nav-indicator" style={{ '--index': active }} aria-hidden="true" />
                {notebookMeta.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.number}
                      ref={active === index ? activeNavRef : undefined}
                      className={active === index ? 'active' : ''}
                      aria-current={active === index ? 'page' : undefined}
                      aria-label={`Notebook ${item.number}: ${item.title}${index < active ? ' (visited)' : ''}`}
                      onClick={() => openNotebook(index)}
                    >
                      <span style={{ '--item-color': item.color }}><Icon size={17} /></span>
                      <div><small>{item.number} · {item.kicker}</small><strong>{item.title}</strong></div>
                      {index < active ? <Check size={15} className="nav-check" /> : <ChevronRight size={15} />}
                    </button>
                  )
                })}
              </nav>
              <div className="progress-card">
                <span>Your progress</span>
                <div><i style={{ width: `${((active + 1) / NOTEBOOK_COUNT) * 100}%` }} /></div>
                <strong>{active + 1} of {NOTEBOOK_COUNT} notebooks</strong>
              </div>
            </aside>
            <div className="lesson-content">
              {active === 0 && <NotebookOne noise={noise} setNoise={setNoise} sample={sample} setSample={setSample} points={points} model={model} />}
              {active === 1 && <NotebookTwo points={points} model={model} />}
              {active === 2 && <NotebookThree points={points} model={model} />}
              {active === 3 && <NotebookFour />}
              {active === 4 && <NotebookFive />}
              {active === 5 && <NotebookSix points={points} model={model} />}
              {active === 6 && <NotebookSeven />}
              <div className="lesson-footer">
                <button className="secondary-button" disabled={active === 0} onClick={() => openNotebook(active - 1)}><ChevronLeft size={16} aria-hidden="true" /> <span className="button-label">Previous</span></button>
                <span>{notebookMeta[active].number} / {notebookMeta[LAST_NOTEBOOK].number}</span>
                <button className="primary-button small" onClick={() => active === LAST_NOTEBOOK ? goOverview() : openNotebook(active + 1)}><span className="button-label">{active === LAST_NOTEBOOK ? 'Back to overview' : 'Next notebook'}</span> <ChevronRight size={16} aria-hidden="true" /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
