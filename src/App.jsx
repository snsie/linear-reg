import { useMemo, useState } from 'react'
import {
  Activity,
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
  Sparkles,
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
    kicker: 'Check',
    title: 'Diagnose the model',
    short: 'Read residuals, R², and RMSE.',
    icon: Activity,
    color: '#8b5fa4',
  },
  {
    number: '05',
    kicker: 'Apply',
    title: 'Make a prediction',
    short: 'Predict carefully and avoid extrapolation.',
    icon: Gauge,
    color: '#d09a2f',
  },
]

function makePatients(noise = 10, sample = 0, scenario = 'linear', outlier = false) {
  const points = Array.from({ length: 48 }, (_, i) => {
    const wave = Math.sin(i * 12.9898 + sample * 3.17) * 43758.5453
    const wave2 = Math.cos(i * 6.733 + sample * 1.91) * 13631.71
    const randomA = wave - Math.floor(wave)
    const randomB = wave2 - Math.floor(wave2)
    const bmi = 17 + randomA * 25
    const centered = bmi - 29.5
    const base = scenario === 'curved'
      ? 124 + 0.11 * centered * centered + 0.35 * centered
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
}) {
  const width = 720
  const height = compact ? 360 : 430
  const margin = { top: 24, right: 22, bottom: 55, left: 68 }
  const xMin = 15
  const xMax = 58
  const yMin = 90
  const yMax = 180
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
        {[100, 120, 140, 160, 180].map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={py(tick)} y2={py(tick)} className="grid-line" />
            <text x={margin.left - 13} y={py(tick) + 4} textAnchor="end" className="tick-label">{tick}</text>
          </g>
        ))}
        {[20, 30, 40, 50].map((tick) => (
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
  const py = (value) => height - margin.bottom - ((value + 35) / 70) * (height - margin.top - margin.bottom)
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Residual plot">
        {[-30, -15, 0, 15, 30].map((tick) => (
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function Callout({ icon: Icon = Sparkles, tone = 'orange', title, children }) {
  return (
    <aside className={`callout ${tone}`}>
      <Icon size={20} aria-hidden="true" />
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
  return (
    <div className="notebook-heading">
      <div className="notebook-index" style={{ '--notebook-color': meta.color }}>
        <Icon size={22} />
        <span>{meta.number}</span>
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{meta.title}</h2>
        <p>{children}</p>
      </div>
    </div>
  )
}

function NotebookOne({ noise, setNoise, sample, setSample, points, model }) {
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[0]} eyebrow="Notebook 01 · 4 minutes">
        Start with the raw observations. Change the noise to see how patient-to-patient variation can blur a real trend.
      </NotebookHeader>

      <div className="two-column">
        <div className="panel chart-panel">
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
        </div>

        <div className="stack">
          <div className="panel controls-panel">
            <div className="panel-topline compact"><div><span className="panel-kicker">Control</span><h3>How scattered are the patients?</h3></div></div>
            <Slider label="Noise" value={noise} min={4} max={20} step={1} onChange={setNoise} suffix=" mmHg" />
            <div className="noise-scale"><span>Tight fit</span><span>Messy clinic</span></div>
            <div className="mini-metrics">
              <Metric label="R²" value={fmt(model.r2, 2)} note="variance explained" accent={TEAL} />
              <Metric label="RMSE" value={`${fmt(model.rmse)} mmHg`} note="typical miss" accent={ORANGE} />
            </div>
          </div>
          <Callout title="Notice what stays steady">
            More noise weakens prediction, but it does not erase the underlying positive relationship.
          </Callout>
        </div>
      </div>

      <div className="data-strip panel">
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
      </div>
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
        <div className="panel chart-panel">
          <div className="panel-topline">
            <div><span className="panel-kicker">Your model</span><h3>ŷ = {fmt(intercept)} + {fmt(slope, 2)} × BMI</h3></div>
            <button className={`reveal-button ${showBest ? 'active' : ''}`} onClick={() => setShowBest((value) => !value)}>
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
        </div>
        <div className="stack fit-controls">
          <div className="panel controls-panel">
            <span className="panel-kicker">Tune the line</span>
            <Slider label="Intercept (a)" value={intercept} min={45} max={125} step={0.5} onChange={setIntercept} />
            <Slider label="Slope (b)" value={slope} min={-0.5} max={5} step={0.05} onChange={setSlope} />
            <button className="secondary-button" onClick={() => { setIntercept(76.3); setSlope(2.11) }}>Get close</button>
          </div>
          <div className="metric-grid vertical">
            <Metric label="Your SSR" value={Math.round(userSsr).toLocaleString()} note="lower is better" accent={ORANGE} />
            <Metric label="Mean residual" value={`${meanResidual >= 0 ? '+' : ''}${fmt(meanResidual)} mmHg`} note={Math.abs(meanResidual) < 1 ? 'well centered' : meanResidual > 0 ? 'line sits too low' : 'line sits too high'} accent={RED} />
            <Metric label="Distance from best" value={`${fmt(ratio, 2)}×`} note={ratio < 1.05 ? 'within 5% — nice work' : 'keep tuning'} accent={TEAL} />
          </div>
        </div>
      </div>

      <Callout icon={Target} tone="navy" title="Why one line wins">
        Least squares tries every possible line and selects the unique one with the smallest sum of squared residuals.
      </Callout>
    </section>
  )
}

function LeastSquaresPlot({ points, model, slope }) {
  const width = 720
  const height = 340
  const margin = { top: 30, right: 30, bottom: 55, left: 74 }
  const slopes = Array.from({ length: 81 }, (_, i) => -1 + i * 0.075)
  const values = slopes.map((candidate) => {
    const intercept = model.yMean - candidate * model.xMean
    return points.reduce((sum, p) => sum + (p.bp - (intercept + candidate * p.bmi)) ** 2, 0)
  })
  const max = Math.min(Math.max(...values), model.ssr * 12)
  const px = (value) => margin.left + ((value + 1) / 6) * (width - margin.left - margin.right)
  const py = (value) => height - margin.bottom - ((Math.min(value, max) - model.ssr) / (max - model.ssr)) * (height - margin.top - margin.bottom)
  const path = slopes.map((candidate, i) => `${i ? 'L' : 'M'} ${px(candidate)} ${py(values[i])}`).join(' ')
  const currentIntercept = model.yMean - slope * model.xMean
  const currentSsr = points.reduce((sum, p) => sum + (p.bp - (currentIntercept + slope * p.bmi)) ** 2, 0)
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sum of squared residuals by slope">
        {[0, .25, .5, .75, 1].map((portion) => {
          const y = model.ssr + portion * (max - model.ssr)
          return <line key={portion} x1={margin.left} x2={width - margin.right} y1={py(y)} y2={py(y)} className="grid-line" />
        })}
        {[-1, 0, 1, 2, 3, 4, 5].map((tick) => <text key={tick} x={px(tick)} y={height - 24} textAnchor="middle" className="tick-label">{tick}</text>)}
        <path d={path} fill="none" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
        <line x1={px(model.slope)} x2={px(model.slope)} y1={py(model.ssr)} y2={height - margin.bottom} stroke={TEAL} strokeDasharray="5 5" strokeWidth="2" />
        <circle cx={px(model.slope)} cy={py(model.ssr)} r="8" fill={TEAL} stroke="#fff" strokeWidth="3" />
        <circle cx={px(slope)} cy={py(currentSsr)} r="9" fill={ORANGE} stroke="#fff" strokeWidth="3" />
        <text x={px(model.slope) + 11} y={py(model.ssr) - 11} className="minimum-label">minimum</text>
        <AxisLabel x={width / 2} y={height - 5}>Slope</AxisLabel>
        <AxisLabel x={20} y={height / 2} rotate>Sum of squared residuals</AxisLabel>
      </svg>
    </div>
  )
}

function NotebookThree({ points, model }) {
  const [slope, setSlope] = useState(0.5)
  const intercept = model.yMean - slope * model.xMean
  const currentSsr = points.reduce((sum, p) => sum + (p.bp - (intercept + slope * p.bmi)) ** 2, 0)
  const r = Math.sqrt(Math.max(0, model.r2))
  const xSd = Math.sqrt(points.reduce((sum, p) => sum + (p.bmi - model.xMean) ** 2, 0) / points.length)
  const ySd = Math.sqrt(points.reduce((sum, p) => sum + (p.bp - model.yMean) ** 2, 0) / points.length)
  const formulaSlope = r * (ySd / xSd)
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[2]} eyebrow="Notebook 03 · 4 minutes">
        Pin every candidate line through the point of averages, then sweep the slope. The error curve has one bottom — the least-squares solution.
      </NotebookHeader>

      <div className="fit-layout">
        <div className="panel chart-panel">
          <div className="panel-topline">
            <div><span className="panel-kicker">The optimization landscape</span><h3>SSR versus slope</h3></div>
            <span className="formula-chip">one bowl · one minimum</span>
          </div>
          <LeastSquaresPlot points={points} model={model} slope={slope} />
          <div className="legend-row">
            <span><i className="dot current-dot" /> Your slope</span>
            <span><i className="dot minimum-dot" /> Least-squares minimum</span>
          </div>
        </div>
        <div className="stack fit-controls">
          <div className="panel controls-panel">
            <span className="panel-kicker">Move along the bowl</span>
            <Slider label="Candidate slope" value={slope} min={-1} max={5} step={0.05} onChange={setSlope} />
            <button className="secondary-button" onClick={() => setSlope(Number(model.slope.toFixed(2)))}>Jump to minimum</button>
          </div>
          <div className="metric-grid vertical">
            <Metric label="Candidate SSR" value={Math.round(currentSsr).toLocaleString()} note={`${fmt(currentSsr / model.ssr, 2)}× the minimum`} accent={ORANGE} />
            <Metric label="Best slope" value={fmt(model.slope, 2)} note="unique minimum" accent={TEAL} />
            <Metric label="Best intercept" value={fmt(model.intercept, 1)} note="line's anchor" accent={NAVY} />
          </div>
        </div>
      </div>

      <div className="formula-panel panel">
        <div><span className="panel-kicker">Same line, two ways</span><h3>Formula and software agree</h3><p>The reading’s standard-units formula lands on the same slope as the computer fit.</p></div>
        <div className="formula-comparison">
          <div><small>From the formula</small><strong>r × SDᵧ / SDₓ = {fmt(formulaSlope, 2)}</strong></div>
          <ArrowRight size={20} />
          <div><small>From least squares</small><strong>linregress slope = {fmt(model.slope, 2)}</strong></div>
          <span className="match-badge"><Check size={14} /> Match</span>
        </div>
      </div>
    </section>
  )
}

function NotebookFour() {
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
      <NotebookHeader meta={notebookMeta[3]} eyebrow="Notebook 04 · 5 minutes">
        A score is only a summary. Change the scenario, inspect the residuals, and decide whether a straight line deserves your trust.
      </NotebookHeader>

      <div className="scenario-bar panel">
        <div className="segmented" role="group" aria-label="Relationship scenario">
          <button className={scenario === 'linear' ? 'active' : ''} onClick={() => setScenario('linear')}>Linear</button>
          <button className={scenario === 'curved' ? 'active' : ''} onClick={() => setScenario('curved')}>Curved</button>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={outlier} onChange={(event) => setOutlier(event.target.checked)} />
          <span className="toggle" />
          Add an extreme patient
        </label>
        <div className="scenario-noise">
          <span>Noise</span>
          <input type="range" min="4" max="20" step="1" value={noise} onChange={(event) => setNoise(Number(event.target.value))} />
          <strong>{noise}</strong>
        </div>
      </div>

      <div className="diagnostic-grid">
        <div className="panel chart-panel diagnostic">
          <div className="panel-topline compact"><div><span className="panel-kicker">Observed vs fitted</span><h3>Regression line</h3></div><span className="formula-chip">ŷ = {fmt(model.intercept)} + {fmt(model.slope, 2)}x</span></div>
          <ScatterPlot points={points} model={model} userLine={{ intercept: model.intercept, slope: model.slope }} compact />
        </div>
        <div className="panel chart-panel diagnostic">
          <div className="panel-topline compact"><div><span className="panel-kicker">Pattern check</span><h3>Residual plot</h3></div><span className={`status-chip ${scenario === 'curved' || outlier ? 'warn' : ''}`}>{scenario === 'curved' || outlier ? 'Inspect' : 'Looks healthy'}</span></div>
          <ResidualPlot points={points} model={model} />
        </div>
      </div>

      <div className="diagnostic-summary">
        <div className="metric-grid">
          <Metric label="R²" value={fmt(model.r2, 2)} note="variance explained" accent="#8b5fa4" />
          <Metric label="RMSE" value={`${fmt(model.rmse)} mmHg`} note="typical prediction miss" accent={ORANGE} />
          <Metric label="Slope" value={fmt(model.slope, 2)} note="mmHg per BMI unit" accent={TEAL} />
        </div>
        <Callout icon={CircleAlert} tone={scenario === 'curved' || outlier ? 'purple' : 'teal'} title="Your diagnostic read">{insight}</Callout>
      </div>
    </section>
  )
}

function NotebookFive({ points, model }) {
  const [bmi, setBmi] = useState(28)
  const [showCode, setShowCode] = useState(false)
  const prediction = model.intercept + model.slope * bmi
  const low = prediction - 2 * model.rmse
  const high = prediction + 2 * model.rmse
  const extrapolating = bmi < 17 || bmi > 42
  return (
    <section className="notebook-page">
      <NotebookHeader meta={notebookMeta[4]} eyebrow="Notebook 05 · 4 minutes">
        Turn the fitted equation into a patient prediction, then check the uncertainty and whether the input stays inside the observed data range.
      </NotebookHeader>

      <div className="prediction-hero panel">
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
      </div>

      <div className="two-column code-section">
        <div className="panel chart-panel prediction-chart">
          <div className="panel-topline compact"><div><span className="panel-kicker">Where the prediction sits</span><h3>Clinic sample</h3></div></div>
          <ScatterPlot points={points} model={model} userLine={{ intercept: model.intercept, slope: model.slope }} predictionX={bmi} compact />
        </div>
        <div className="panel code-card">
          <div className="panel-topline">
            <div><span className="panel-kicker">Python in practice</span><h3>Three-step recipe</h3></div>
            <button className="code-toggle" onClick={() => setShowCode((value) => !value)}><Code2 size={16} />{showCode ? 'Hide code' : 'Show code'}</button>
          </div>
          {showCode ? (
            <pre><code><span className="code-comment"># 1. Fit</span>{'\n'}fit = stats.linregress(bmi, systolic_bp){'\n\n'}<span className="code-comment"># 2. Predict + inspect errors</span>{'\n'}predicted = fit.intercept + fit.slope * bmi{'\n'}residual = systolic_bp - predicted{'\n\n'}<span className="code-comment"># 3. Plot both views</span>{'\n'}plt.scatter(bmi, systolic_bp){'\n'}plt.plot(bmi, predicted)</code></pre>
          ) : (
            <ol className="recipe-list">
              <li><span>01</span><div><strong>Fit</strong><p>Estimate the slope and intercept.</p></div></li>
              <li><span>02</span><div><strong>Predict</strong><p>Calculate fitted values and residuals.</p></div></li>
              <li><span>03</span><div><strong>Plot</strong><p>Inspect the line and residual pattern.</p></div></li>
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}

function Overview({ onOpen }) {
  return (
    <section className="overview">
      <div className="hero-copy">
        <div className="hero-badge"><BookOpen size={15} /> Interactive lesson · 20 minutes</div>
        <h1>Build the line.<br /><em>Trust it wisely.</em></h1>
        <p>Five visual notebooks turn linear regression from an equation into something you can see, tune, explain, challenge, and use.</p>
        <button className="primary-button" onClick={() => onOpen(0)}>Open notebook 01 <ArrowRight size={18} /></button>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="graph-paper">
          <svg viewBox="0 0 520 390">
            <line x1="58" y1="330" x2="472" y2="75" stroke={ORANGE} strokeWidth="8" strokeLinecap="round" />
            {[[83,302],[116,283],[140,275],[165,260],[198,235],[215,242],[242,204],[276,205],[305,164],[328,177],[357,133],[391,126],[424,96],[448,111]].map(([x,y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 8 : 6} fill={INK} opacity={.78} />)}
            {[[140,275,278],[215,242,233],[328,177,164],[391,126,125]].map(([x,y,y2], i) => <line key={i} x1={x} x2={x} y1={y} y2={y2} stroke={RED} strokeWidth="3" />)}
          </svg>
          <div className="equation-card">ŷ = <span>a</span> + <strong>b</strong>x</div>
          <div className="annotation">Every point tells a story.</div>
        </div>
      </div>
      <div className="notebook-shelf">
        {notebookMeta.map((item, index) => {
          const Icon = item.icon
          return (
            <button key={item.number} className="cover-card" style={{ '--cover': item.color }} onClick={() => onOpen(index)}>
              <span className="cover-number">{item.number}</span>
              <span className="cover-icon"><Icon size={21} /></span>
              <span className="cover-kicker">{item.kicker}</span>
              <strong>{item.title}</strong>
              <small>{item.short}</small>
              <span className="cover-link">Open notebook <ArrowRight size={15} /></span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function App() {
  const [active, setActive] = useState(-1)
  const [noise, setNoise] = useState(10)
  const [sample, setSample] = useState(0)
  const points = useMemo(() => makePatients(noise, sample), [noise, sample])
  const model = useMemo(() => regression(points), [points])
  const openNotebook = (index) => {
    setActive(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActive(-1)} aria-label="Return to overview">
          <span className="brand-mark"><LineChart size={20} /></span>
          <span><strong>Linear Regression</strong><small>Visual Lab</small></span>
        </button>
        <div className="topbar-meta"><span className="live-dot" /> BMI → systolic BP</div>
        <button className="outline-button" onClick={() => openNotebook(active < 0 ? 0 : (active + 1) % 5)}>
          {active < 0 ? 'Start lesson' : active === 4 ? 'Start over' : 'Next notebook'} <ArrowRight size={16} />
        </button>
      </header>

      <main>
        {active < 0 ? <Overview onOpen={openNotebook} /> : (
          <div className="lesson-layout">
            <aside className="side-nav">
              <button className="back-link" onClick={() => setActive(-1)}><ChevronLeft size={16} /> Overview</button>
              <p className="side-label">Five notebooks</p>
              <nav>
                {notebookMeta.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <button key={item.number} className={active === index ? 'active' : ''} onClick={() => openNotebook(index)}>
                      <span style={{ '--item-color': item.color }}><Icon size={17} /></span>
                      <div><small>{item.number} · {item.kicker}</small><strong>{item.title}</strong></div>
                      {index < active ? <Check size={15} className="nav-check" /> : <ChevronRight size={15} />}
                    </button>
                  )
                })}
              </nav>
              <div className="progress-card">
                <span>Your progress</span>
                <div><i style={{ width: `${((active + 1) / 5) * 100}%` }} /></div>
                <strong>{active + 1} of 5 notebooks</strong>
              </div>
            </aside>
            <div className="lesson-content">
              {active === 0 && <NotebookOne noise={noise} setNoise={setNoise} sample={sample} setSample={setSample} points={points} model={model} />}
              {active === 1 && <NotebookTwo points={points} model={model} />}
              {active === 2 && <NotebookThree points={points} model={model} />}
              {active === 3 && <NotebookFour />}
              {active === 4 && <NotebookFive points={points} model={model} />}
              <div className="lesson-footer">
                <button className="secondary-button" disabled={active === 0} onClick={() => openNotebook(active - 1)}><ChevronLeft size={16} /> Previous</button>
                <span>{notebookMeta[active].number} / 05</span>
                <button className="primary-button small" onClick={() => active === 4 ? setActive(-1) : openNotebook(active + 1)}>{active === 4 ? 'Back to overview' : 'Next notebook'} <ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
