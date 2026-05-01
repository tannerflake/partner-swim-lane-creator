import React, { useRef } from 'react'
import tinyHealthLogo from '../public/PNG image.png'

export default function ControlPanel({
  partnerName,
  setPartnerName,
  partnerLogo,
  setPartnerLogo,
  partnerColor,
  setPartnerColor,
  diagramTitle,
  setDiagramTitle,
  showPhase2,
  setShowPhase2,
  onExport,
  exporting,
}) {
  const fileInputRef = useRef(null)

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPartnerLogo(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div style={styles.panel}>
      <div style={styles.panelInner}>
        <div style={styles.brand}>
          <img src={tinyHealthLogo} alt="Tiny Health" style={styles.brandLogo} />
          <div>
            <div style={styles.brandTitle}>Swim Lane Creator</div>
            <div style={styles.brandSub}>Tiny Health Partner API</div>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.fields}>
          <Field label="Diagram Title">
            <input
              style={styles.input}
              type="text"
              value={diagramTitle}
              onChange={e => setDiagramTitle(e.target.value)}
              placeholder="Diagram title…"
            />
          </Field>

          <Field label="Partner Name">
            <input
              style={styles.input}
              type="text"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              placeholder="e.g. Function Health"
            />
          </Field>

          <Field label="Partner Lane Color">
            <div style={styles.colorRow}>
              <input
                type="color"
                value={partnerColor}
                onChange={e => setPartnerColor(e.target.value)}
                style={styles.colorInput}
              />
              <span style={styles.colorHex}>{partnerColor}</span>
              <button style={styles.btnGhost} onClick={() => setPartnerColor('#DBEAFE')}>
                Reset
              </button>
            </div>
          </Field>

          <Field label="Partner Logo">
            <div style={styles.logoRow}>
              {partnerLogo ? (
                <img
                  src={partnerLogo}
                  alt="Partner logo"
                  style={styles.logoPreview}
                />
              ) : (
                <div style={styles.logoEmpty}>No logo</div>
              )}
              <button style={styles.btnSecondary} onClick={() => fileInputRef.current?.click()}>
                Upload
              </button>
              {partnerLogo && (
                <button style={styles.btnGhost} onClick={() => setPartnerLogo(null)}>
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </div>
          </Field>

        </div>

        <div style={styles.divider} />

        <button
          style={{ ...styles.btnExport, opacity: exporting ? 0.7 : 1 }}
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <span style={styles.spinner}>⟳</span> Exporting…
            </>
          ) : (
            <>
              <span>↓</span> Export as PNG
            </>
          )}
        </button>

        <p style={styles.hint}>
          Exports diagram only at 2× resolution — ready to drop into Notion, docs, or slides.
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </div>
  )
}

const styles = {
  panel: {
    width: 260,
    flexShrink: 0,
    background: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    height: '100vh',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
  },
  panelInner: {
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  brandLogo: {
    height: 84,
    width: 'auto',
    objectFit: 'contain',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.3,
  },
  brandSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    background: '#F3F4F6',
    margin: '16px -16px',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 13,
    color: '#111827',
    background: '#F9FAFB',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorInput: {
    width: 32,
    height: 32,
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: 2,
    cursor: 'pointer',
    background: 'none',
  },
  colorHex: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoEmpty: {
    fontSize: 11,
    color: '#9CA3AF',
    padding: '4px 0',
  },
  logoPreview: {
    height: 28,
    maxWidth: 70,
    objectFit: 'contain',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    padding: 2,
    background: '#fff',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  checkbox: {
    width: 15,
    height: 15,
    cursor: 'pointer',
    accentColor: '#059669',
  },
  toggleLabel: {
    fontSize: 13,
    color: '#374151',
  },
  btnExport: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: 4,
    transition: 'background 0.15s',
  },
  btnSecondary: {
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    color: '#EF4444',
    border: '1px solid #FCA5A5',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  hint: {
    fontSize: 10.5,
    color: '#9CA3AF',
    lineHeight: 1.5,
    marginTop: 10,
    textAlign: 'center',
  },
}
