import domtoimage from 'dom-to-image-more'

export async function exportDiagramAsPng(diagramEl, partnerName, scale = 2) {
  const slug = partnerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'partner'

  const filename = `tinyhealth-${slug}-api-flow.png`

  const rect = diagramEl.getBoundingClientRect()

  const dataUrl = await domtoimage.toPng(diagramEl, {
    width: rect.width * scale,
    height: rect.height * scale,
    style: {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    },
    bgcolor: '#ffffff',
    quality: 1,
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
