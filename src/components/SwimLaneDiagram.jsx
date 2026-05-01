import React from 'react'
import { STEPS, ARROWS, PHASES, PHASE_COLORS, PHASE_BORDER_COLORS, PHASE_TEXT_COLORS } from '../data/steps.js'
import thLogo from '../public/PNG image.png'

// ─── Layout constants ────────────────────────────────────────────────────────
const LANE_HEADER_W = 190
const COL_W         = 178
const CARD_W        = 150
const CARD_H        = 110   // minimum card height
const LANE_H        = 270   // tall enough for expanded cards
const CARD_PAD_TOP  = 20    // top margin within lane before card
const TITLE_H       = 68
const PHASE_H       = 32
const FOOTER_H      = 44
const NUM_COLS      = 17

const LANE_Y = {
  partner: TITLE_H + PHASE_H,
  api:     TITLE_H + PHASE_H + LANE_H,
  backend: TITLE_H + PHASE_H + LANE_H * 2,
}

const CARD_TOP = {
  partner: LANE_Y.partner + CARD_PAD_TOP,
  api:     LANE_Y.api     + CARD_PAD_TOP,
  backend: LANE_Y.backend + CARD_PAD_TOP,
}

const TOTAL_W = LANE_HEADER_W + NUM_COLS * COL_W + 20
const TOTAL_H = TITLE_H + PHASE_H + LANE_H * 3 + FOOTER_H

// ─── Helpers ─────────────────────────────────────────────────────────────────
const cardX = (col) => LANE_HEADER_W + col * COL_W + (COL_W - CARD_W) / 2

function wrapText(text, maxWidth, fontSize = 10.5) {
  const charW    = fontSize * 0.56
  const maxChars = Math.floor(maxWidth / charW)
  const words    = text.split(' ')
  const lines    = []
  let line       = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length <= maxChars) {
      line = candidate
    } else {
      if (line) lines.push(line)
      line = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word
    }
  }
  if (line) lines.push(line)
  return lines  // no line cap — let computeCardHeight expand the card
}

function computeCardHeight(step) {
  const PTOP    = 20
  const PBOT    = 16
  const LABEL_H = 16
  const EP_H    = 13
  const DESC_H  = 13
  const GAP_LBL = step.endpoint ? 4 : 6
  const GAP_EP  = 5

  const labelLines    = wrapText(step.label, CARD_W - 18, 12)
  const endpointLines = step.endpoint ? wrapText(step.endpoint, CARD_W - 14, 9.5) : []
  const descLines     = wrapText(step.description, CARD_W - 16)

  let h = PTOP + labelLines.length * LABEL_H + GAP_LBL
  if (step.endpoint) h += endpointLines.length * EP_H + GAP_EP
  h += descLines.length * DESC_H + PBOT

  // Extra room for bottom badges
  if (step.isOptional || step.isPolling) h += 10

  return Math.max(h, CARD_H)
}

const getCardBounds = (step) => {
  const x          = cardX(step.col)
  const cardHeight = computeCardHeight(step)
  const y          = CARD_TOP[step.lane]
  return {
    x, y,
    cx:     x + CARD_W / 2,
    cy:     y + CARD_H / 2,   // fixed vertical midpoint for consistent arrow routing
    right:  x + CARD_W,
    bottom: y + cardHeight,
    top:    y,
  }
}

const stepById = Object.fromEntries(STEPS.map(s => [s.id, s]))

// ─── Arrow path builder ───────────────────────────────────────────────────────
const LANE_ORDER = ['partner', 'api', 'backend']

function buildArrowPath(fromStep, toStep, type) {
  const f = getCardBounds(fromStep)
  const t = getCardBounds(toStep)

  if (type === 'response') {
    const fromCardH  = computeCardHeight(fromStep)
    const toCardH    = computeCardHeight(toStep)
    const fromBottom = CARD_TOP[fromStep.lane] + fromCardH
    const toBottom   = CARD_TOP[toStep.lane]   + toCardH
    const belowY     = Math.max(fromBottom + 16, LANE_Y[fromStep.lane] + LANE_H - 16)
    const margin     = f.right + 18
    return `M ${f.right} ${f.cy} H ${margin} V ${belowY} H ${t.cx} V ${toBottom}`
  }

  const fIdx = LANE_ORDER.indexOf(fromStep.lane)
  const tIdx = LANE_ORDER.indexOf(toStep.lane)

  if (fIdx === tIdx) {
    return `M ${f.right} ${f.cy} H ${t.x}`
  }

  // Cross-lane L-shape — ensure final horizontal segment ≥ 22px so arrowhead has a neck
  const midX  = f.right + (t.x - f.right) / 2
  const vertX = Math.max(f.right + 4, Math.min(midX, t.x - 22))
  return `M ${f.right} ${f.cy} H ${vertX} V ${t.cy} H ${t.x}`
}

function arrowLabelPoint(fromStep, toStep, type) {
  const f = getCardBounds(fromStep)
  const t = getCardBounds(toStep)

  if (type === 'response') {
    const fromCardH  = computeCardHeight(fromStep)
    const fromBottom = CARD_TOP[fromStep.lane] + fromCardH
    const belowY     = Math.max(fromBottom + 16, LANE_Y[fromStep.lane] + LANE_H - 16)
    return { x: f.right + 22, y: belowY - 6 }
  }

  if (fromStep.lane === toStep.lane) {
    return { x: (f.right + t.x) / 2, y: f.cy - 8 }
  }

  const midX  = f.right + (t.x - f.right) / 2
  const vertX = Math.max(f.right + 4, Math.min(midX, t.x - 22))
  return { x: vertX + 6, y: (f.cy + t.cy) / 2 }
}

// Returns true for API-style labels (HTTP verbs, snake_case identifiers, paths)
function isCodeLabel(label) {
  if (/^(GET|POST|PUT|DELETE|PATCH)\s/.test(label)) return true
  if (label.includes('/')) return true
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(label)) return true  // snake_case
  return false
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LaneBackground({ lane, color }) {
  return <rect x={0} y={LANE_Y[lane]} width={TOTAL_W} height={LANE_H} fill={color} />
}

function LaneDivider({ lane }) {
  if (lane === 'partner') return null
  return (
    <line
      x1={0} y1={LANE_Y[lane]}
      x2={TOTAL_W} y2={LANE_Y[lane]}
      stroke="#D1D5DB" strokeWidth={1}
    />
  )
}

function LaneLabel({ lane, label, color, logo, headerLogo }) {
  const laneY = LANE_Y[lane]
  const midY  = laneY + LANE_H / 2
  // Wrap each explicit line segment so long names don't overflow the header
  const lines = label.split('\n').flatMap(seg => wrapText(seg, LANE_HEADER_W - 20, 12))

  // When headerLogo is present, shift text down so logo fits above
  const logoH      = 28
  const logoGap    = 8
  const blockH     = headerLogo ? logoH + logoGap + lines.length * 17 : lines.length * 17
  const textStartY = headerLogo
    ? midY - blockH / 2 + logoH + logoGap
    : midY - (lines.length - 1) * 17 / 2

  return (
    <g>
      <rect x={0} y={laneY} width={LANE_HEADER_W} height={LANE_H} fill={color} opacity={0.5} />
      <line
        x1={LANE_HEADER_W} y1={laneY}
        x2={LANE_HEADER_W} y2={laneY + LANE_H}
        stroke="#D1D5DB" strokeWidth={1}
      />

      {logo ? (
        <image
          href={logo}
          x={LANE_HEADER_W / 2 - 72}
          y={midY - 28}
          width={144}
          height={56}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <>
          {lines.map((line, i) => (
            <text
              key={i}
              x={LANE_HEADER_W / 2}
              y={textStartY + i * 17}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
              fill="#374151"
              letterSpacing="0.05em"
            >
              {line.toUpperCase()}
            </text>
          ))}
          {/* TH logo watermark in bottom-right of api/backend headers */}
          {(lane === 'api' || lane === 'backend') && (
            <image
              href={thLogo}
              x={LANE_HEADER_W - 46}
              y={laneY + LANE_H - 20}
              width={40}
              height={14}
              preserveAspectRatio="xMidYMid meet"
              opacity={0.5}
            />
          )}
        </>
      )}
    </g>
  )
}

function PhaseSection({ phase, phaseIndex }) {
  const x1          = LANE_HEADER_W + phase.colStart * COL_W
  const x2          = LANE_HEADER_W + (phase.colEnd + 1) * COL_W
  const w           = x2 - x1
  const color       = PHASE_COLORS[phaseIndex]
  const borderColor = PHASE_BORDER_COLORS[phaseIndex]
  const textColor   = PHASE_TEXT_COLORS[phaseIndex]

  return (
    <g>
      <rect x={x1} y={TITLE_H} width={w} height={PHASE_H} fill={color} stroke={borderColor} strokeWidth={1} />
      <text
        x={x1 + w / 2} y={TITLE_H + PHASE_H / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="600"
        fontFamily="Inter, sans-serif"
        fill={textColor} letterSpacing="0.04em"
      >
        PHASE {phase.id} — {phase.label.toUpperCase()}
      </text>
      <line
        x1={x2} y1={TITLE_H}
        x2={x2} y2={TOTAL_H - FOOTER_H}
        stroke="#6B7280" strokeWidth={1.5}
        opacity={0.25}
      />
    </g>
  )
}

function StepCard({ step, showPhase2, partnerLogo }) {
  const b       = getCardBounds(step)
  const isHidden = step.isOptional && !showPhase2
  if (isHidden) return null

  const dimmed     = step.isOptional
  const opacity    = dimmed ? 0.65 : 1
  const cardHeight = computeCardHeight(step)

  const labelLines    = wrapText(step.label, CARD_W - 18, 12)
  const endpointLines = step.endpoint ? wrapText(step.endpoint, CARD_W - 14, 9.5) : []
  const descLines     = wrapText(step.description, CARD_W - 16)

  const labelLineH    = 16
  const endpointLineH = 13
  const descLineH     = 13
  const paddingTop    = 20
  const gapAfterLabel = step.endpoint ? 4 : 6
  const gapAfterEP    = 5

  return (
    <g opacity={opacity}>
      {/* Shadow */}
      <rect x={b.x + 2} y={b.y + 2} width={CARD_W} height={cardHeight} rx={8} fill="rgba(0,0,0,0.06)" />

      {/* Background */}
      <rect
        x={b.x} y={b.y}
        width={CARD_W} height={cardHeight}
        rx={8}
        fill="#FFFFFF"
        stroke={dimmed ? '#D1D5DB' : '#E5E7EB'}
        strokeWidth={1.5}
        strokeDasharray={dimmed ? '5 3' : undefined}
      />

      {/* Step number — top-left corner */}
      <circle cx={b.x + 2} cy={b.y} r={10} fill={dimmed ? '#9CA3AF' : '#374151'} />
      <text
        x={b.x + 2} y={b.y}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fontWeight="700"
        fontFamily="Inter, sans-serif"
        fill="#FFFFFF"
      >
        {step.id}
      </text>

      {/* Label */}
      {labelLines.map((line, i) => (
        <text
          key={`label-${i}`}
          x={b.x + 18}
          y={b.y + paddingTop + i * labelLineH}
          fontSize="12.5" fontWeight="600"
          fontFamily="Inter, sans-serif"
          fill={dimmed ? '#6B7280' : '#111827'}
        >
          {line}
        </text>
      ))}

      {/* Endpoint */}
      {endpointLines.map((line, i) => (
        <text
          key={`ep-${i}`}
          x={b.x + 8}
          y={b.y + paddingTop + labelLines.length * labelLineH + gapAfterLabel + i * endpointLineH}
          fontSize="9" fontWeight="500"
          fontFamily="'JetBrains Mono', 'Courier New', monospace"
          fill="#1D4ED8"
        >
          {line}
        </text>
      ))}

      {/* Description */}
      {descLines.map((line, i) => {
        const epOffset = step.endpoint ? endpointLines.length * endpointLineH + gapAfterEP : 0
        return (
          <text
            key={`desc-${i}`}
            x={b.x + 8}
            y={b.y + paddingTop + labelLines.length * labelLineH + gapAfterLabel + epOffset + i * descLineH}
            fontSize="10"
            fontFamily="Inter, sans-serif"
            fill="#6B7280"
          >
            {line}
          </text>
        )
      })}

      {/* Optional badge — anchored to actual card bottom */}
      {step.isOptional && (
        <g>
          <rect
            x={b.x + CARD_W - 50} y={b.y + cardHeight - 22}
            width={48} height={18} rx={9}
            fill="#FEF3C7" stroke="#FCD34D" strokeWidth={1}
          />
          <text
            x={b.x + CARD_W - 26} y={b.y + cardHeight - 13}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8.5" fontWeight="700"
            fontFamily="Inter, sans-serif"
            fill="#92400E"
          >
            OPTIONAL
          </text>
        </g>
      )}

      {/* Partner logo — bottom-right of partner cards */}
      {step.lane === 'partner' && partnerLogo && (
        <image
          href={partnerLogo}
          x={b.x + CARD_W - 46}
          y={b.y + cardHeight - 18}
          width={40}
          height={14}
          preserveAspectRatio="xMidYMid meet"
          opacity={dimmed ? 0.4 : 0.55}
        />
      )}

      {/* TH logo — bottom-right of api/backend cards */}
      {(step.lane === 'api' || step.lane === 'backend') && (
        <image
          href={thLogo}
          x={b.x + CARD_W - 46}
          y={b.y + cardHeight - 18}
          width={40}
          height={14}
          preserveAspectRatio="xMidYMid meet"
          opacity={dimmed ? 0.4 : 0.55}
        />
      )}

      {/* Polling badge — anchored to actual card bottom */}
      {step.isPolling && (
        <g>
          <rect
            x={b.x + CARD_W - 44} y={b.y + cardHeight - 22}
            width={42} height={18} rx={9}
            fill="#EDE9FE" stroke="#C4B5FD" strokeWidth={1}
          />
          <text
            x={b.x + CARD_W - 23} y={b.y + cardHeight - 13}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fontWeight="700"
            fontFamily="Inter, sans-serif"
            fill="#6D28D9"
          >
            ↻ POLL
          </text>
        </g>
      )}
    </g>
  )
}

function ArrowPath({ arrow, showPhase2 }) {
  const fromStep = stepById[arrow.from]
  const toStep   = stepById[arrow.to]
  if (!fromStep || !toStep) return null

  if (arrow.type === 'optional' && !showPhase2) return null
  if ((fromStep.isOptional || toStep.isOptional) && !showPhase2) return null

  const isOptional = arrow.type === 'optional'
  const isResponse = arrow.type === 'response'
  const isTime     = arrow.type === 'time'
  const isInternal = arrow.type === 'internal'

  const stroke    = isOptional || isTime || isInternal ? '#9CA3AF' : '#374151'
  const strokeW   = isOptional || isTime || isInternal ? 1.5 : 2
  const dashArray = isOptional ? '6 4' : isResponse ? '5 3' : isTime ? '4 4' : undefined
  const markerId  = isOptional ? 'ah-optional' : isResponse ? 'ah-response' : 'ah-solid'

  const d        = buildArrowPath(fromStep, toStep, arrow.type)
  const lp       = arrowLabelPoint(fromStep, toStep, arrow.type)
  const showLabel = arrow.label && arrow.label.length > 0

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeW}
        strokeDasharray={dashArray}
        markerEnd={`url(#${markerId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLabel && (() => {
        const codeLabel = isCodeLabel(arrow.label)
        const charW     = codeLabel ? 5.8 : 5.0
        const labelFill = isOptional ? '#9CA3AF' : codeLabel ? '#374151' : '#6B7280'
        return (
          <g>
            <rect
              x={lp.x - 3} y={lp.y - 10}
              width={arrow.label.length * charW + 6} height={14}
              fill="rgba(255,255,255,0.92)" rx={3}
            />
            <text
              x={lp.x} y={lp.y}
              fontSize={codeLabel ? '9' : '9.5'}
              fontFamily={codeLabel ? "'JetBrains Mono', monospace" : 'Inter, sans-serif'}
              fontStyle={codeLabel ? 'normal' : 'italic'}
              fontWeight={codeLabel ? '500' : '400'}
              fill={labelFill}
            >
              {arrow.label}
            </text>
          </g>
        )
      })()}
    </g>
  )
}

// ─── Main diagram ─────────────────────────────────────────────────────────────
export default function SwimLaneDiagram({
  diagramRef,
  partnerName  = 'Tiny Health Partner',
  partnerLogo  = null,
  partnerColor = '#DBEAFE',
  diagramTitle = 'Tiny Health Partner API Integration Flow',
  showPhase2   = true,
}) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const laneLabels = {
    partner: partnerName,
    api:     'Tiny Health\nAPI',
    backend: 'Tiny Health\nBackend',
  }

  const laneColors = {
    partner: partnerColor || '#F5F3FF',
    api:     '#FFF0F3',
    backend: '#E6FBF7',
  }

  return (
    <div
      ref={diagramRef}
      style={{ background: '#ffffff', display: 'inline-block', fontFamily: 'Inter, sans-serif' }}
    >
      <svg
        width={TOTAL_W}
        height={TOTAL_H}
        viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="ah-solid" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="#374151" />
          </marker>
          <marker id="ah-response" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#374151" />
          </marker>
          <marker id="ah-optional" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
          </marker>
        </defs>

        {/* White background */}
        <rect x={0} y={0} width={TOTAL_W} height={TOTAL_H} fill="#FFFFFF" />

        {/* Lane backgrounds */}
        <LaneBackground lane="partner" color={laneColors.partner} />
        <LaneBackground lane="api"     color={laneColors.api} />
        <LaneBackground lane="backend" color={laneColors.backend} />

        {/* Outer border */}
        <rect
          x={0} y={TITLE_H + PHASE_H}
          width={TOTAL_W} height={LANE_H * 3}
          fill="none" stroke="#D1D5DB" strokeWidth={1}
        />

        {/* Lane dividers */}
        <LaneDivider lane="api" />
        <LaneDivider lane="backend" />

        {/* Phase sections */}
        {PHASES.map((phase, i) => (
          <PhaseSection key={phase.id} phase={phase} phaseIndex={i} />
        ))}

        {/* Lane header background */}
        <rect
          x={0} y={TITLE_H + PHASE_H}
          width={LANE_HEADER_W} height={LANE_H * 3}
          fill="#F9FAFB" stroke="#D1D5DB" strokeWidth={1}
        />

        {/* Lane labels */}
        <LaneLabel lane="partner" label={laneLabels.partner} color={laneColors.partner} logo={partnerLogo} />
        <LaneLabel lane="api"     label={laneLabels.api}     color={laneColors.api} />
        <LaneLabel lane="backend" label={laneLabels.backend} color={laneColors.backend} />

        {/* Arrows (behind cards) */}
        {ARROWS.map((arrow, i) => (
          <ArrowPath key={i} arrow={arrow} showPhase2={showPhase2} />
        ))}

        {/* Step cards */}
        {STEPS.map(step => (
          <StepCard key={step.id} step={step} showPhase2={showPhase2} partnerLogo={partnerLogo} />
        ))}

        {/* Title bar */}
        <rect x={0} y={0} width={TOTAL_W} height={TITLE_H} fill="#FFFFFF" />
        <line x1={0} y1={TITLE_H} x2={TOTAL_W} y2={TITLE_H} stroke="#E5E7EB" strokeWidth={1} />

        <text
          x={20} y={TITLE_H / 2}
          dominantBaseline="middle"
          fontSize="17" fontWeight="700"
          fontFamily="Inter, sans-serif"
          fill="#111827"
        >
          {diagramTitle}
        </text>

        {/* Footer */}
        <rect x={0} y={TOTAL_H - FOOTER_H} width={TOTAL_W} height={FOOTER_H} fill="#F9FAFB" />
        <line x1={0} y1={TOTAL_H - FOOTER_H} x2={TOTAL_W} y2={TOTAL_H - FOOTER_H} stroke="#E5E7EB" strokeWidth={1} />

        {/* Legend */}
        <line x1={LANE_HEADER_W} y1={TOTAL_H - FOOTER_H / 2} x2={LANE_HEADER_W + 24} y2={TOTAL_H - FOOTER_H / 2} stroke="#374151" strokeWidth={2} markerEnd="url(#ah-solid)" />
        <text x={LANE_HEADER_W + 30} y={TOTAL_H - FOOTER_H / 2 + 4} fontSize="10" fontFamily="Inter, sans-serif" fill="#374151">API Request</text>

        <line x1={LANE_HEADER_W + 120} y1={TOTAL_H - FOOTER_H / 2} x2={LANE_HEADER_W + 144} y2={TOTAL_H - FOOTER_H / 2} stroke="#374151" strokeWidth={1.5} strokeDasharray="5 3" markerEnd="url(#ah-response)" />
        <text x={LANE_HEADER_W + 150} y={TOTAL_H - FOOTER_H / 2 + 4} fontSize="10" fontFamily="Inter, sans-serif" fill="#374151">API Response</text>

        <line x1={LANE_HEADER_W + 255} y1={TOTAL_H - FOOTER_H / 2} x2={LANE_HEADER_W + 279} y2={TOTAL_H - FOOTER_H / 2} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="6 4" markerEnd="url(#ah-optional)" />
        <text x={LANE_HEADER_W + 285} y={TOTAL_H - FOOTER_H / 2 + 4} fontSize="10" fontFamily="Inter, sans-serif" fill="#6B7280">Optional Flow</text>

        <rect x={LANE_HEADER_W + 400} y={TOTAL_H - FOOTER_H / 2 - 8} width={58} height={16} rx={8} fill="#FEF3C7" stroke="#FCD34D" strokeWidth={1} />
        <text x={LANE_HEADER_W + 429} y={TOTAL_H - FOOTER_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif" fill="#92400E">OPTIONAL</text>
        <text x={LANE_HEADER_W + 464} y={TOTAL_H - FOOTER_H / 2 + 4} fontSize="10" fontFamily="Inter, sans-serif" fill="#6B7280">= Optional endpoint</text>

        <rect x={LANE_HEADER_W + 600} y={TOTAL_H - FOOTER_H / 2 - 8} width={46} height={16} rx={8} fill="#EDE9FE" stroke="#C4B5FD" strokeWidth={1} />
        <text x={LANE_HEADER_W + 623} y={TOTAL_H - FOOTER_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif" fill="#6D28D9">↻ POLL</text>
        <text x={LANE_HEADER_W + 652} y={TOTAL_H - FOOTER_H / 2 + 4} fontSize="10" fontFamily="Inter, sans-serif" fill="#6B7280">= Use a cron job to poll for state change</text>

        <text
          x={TOTAL_W - 16} y={TOTAL_H - FOOTER_H / 2 + 4}
          textAnchor="end" fontSize="10"
          fontFamily="Inter, sans-serif" fill="#9CA3AF"
        >
          Tiny Health Confidential — {today}
        </text>
      </svg>
    </div>
  )
}
