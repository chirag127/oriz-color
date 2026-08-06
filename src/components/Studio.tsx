import { useState } from 'react'
import '../styles/studio.css'
import { PickerConvert } from './PickerConvert'
import { PaletteGen } from './PaletteGen'
import { GradientGen } from './GradientGen'
import { ContrastChecker } from './ContrastChecker'
import { ExtractPalette } from './ExtractPalette'

const TABS = [
  { id: 'pick', label: 'Pick + Convert', el: <PickerConvert /> },
  { id: 'palette', label: 'Palettes', el: <PaletteGen /> },
  { id: 'gradient', label: 'Gradient', el: <GradientGen /> },
  { id: 'contrast', label: 'Contrast', el: <ContrastChecker /> },
  { id: 'extract', label: 'Extract', el: <ExtractPalette /> },
] as const

type TabId = (typeof TABS)[number]['id']

/** Root color-studio island: tabbed access to all tools. */
export default function Studio() {
  const [active, setActive] = useState<TabId>('pick')
  const current = TABS.find((t) => t.id === active) ?? TABS[0]

  return (
    <div className="studio">
      <div className="tabs" role="tablist" aria-label="Color tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            className="tab"
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
      >
        {current.el}
      </div>
    </div>
  )
}
