import { useState, useEffect } from 'react'

export default function DragHint() {
  const [show, setShow] = useState(false)
  const [depth, setDepth] = useState(0)

  useEffect(() => {
    let d = 0
    const enter = e => {
      if (e.dataTransfer?.types?.includes('Files')) { d++; if (d === 1) setShow(true) }
    }
    const leave = e => { d = Math.max(0, d - 1); if (d === 0) setShow(false) }
    const over = e => e.preventDefault()
    const drop = e => { e.preventDefault(); d = 0; setShow(false) }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [])

  if (!show) return null
  return (
    <div className="drag-hint show">
      <div className="drag-hint-box">
        🖼 Släpp bilden på ett kort
        <div className="sub">Dra direkt till det kort du vill uppdatera</div>
      </div>
    </div>
  )
}
