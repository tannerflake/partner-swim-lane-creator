import React, { useRef, useState, useCallback } from 'react'
import SwimLaneDiagram from './components/SwimLaneDiagram.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import { exportDiagramAsPng } from './utils/exportPng.js'

export default function App() {
  const diagramRef = useRef(null)

  const [partnerName,  setPartnerName]  = useState('Partner')
  const [partnerLogo,  setPartnerLogo]  = useState(null)
  const [partnerColor, setPartnerColor] = useState('#DBEAFE')
  const [diagramTitle, setDiagramTitle] = useState('Tiny Health Partner API Integration Flow')
  const [showPhase2,   setShowPhase2]   = useState(true)
  const [exporting,    setExporting]    = useState(false)

  const handleExport = useCallback(async () => {
    if (!diagramRef.current || exporting) return
    setExporting(true)
    try {
      await exportDiagramAsPng(diagramRef.current, partnerName, 2)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Check browser console for details.')
    } finally {
      setExporting(false)
    }
  }, [partnerName, exporting])

  return (
    <div style={styles.root}>
      <ControlPanel
        partnerName={partnerName}
        setPartnerName={setPartnerName}
        partnerLogo={partnerLogo}
        setPartnerLogo={setPartnerLogo}
        partnerColor={partnerColor}
        setPartnerColor={setPartnerColor}
        diagramTitle={diagramTitle}
        setDiagramTitle={setDiagramTitle}
        showPhase2={showPhase2}
        setShowPhase2={setShowPhase2}
        onExport={handleExport}
        exporting={exporting}
      />

      <div style={styles.canvas}>
        <div style={styles.diagramWrapper}>
          <SwimLaneDiagram
            diagramRef={diagramRef}
            partnerName={partnerName}
            partnerLogo={partnerLogo}
            partnerColor={partnerColor}
            diagramTitle={diagramTitle}
            showPhase2={showPhase2}
          />
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#F9FAFB',
  },
  canvas: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
    minWidth: 0,
  },
  diagramWrapper: {
    boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'inline-block',
    background: '#fff',
  },
}
