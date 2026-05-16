'use client'

import { motion } from 'framer-motion'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  selected: string | null
  onChange: (id: string | null) => void
}

export default function CategoryFilter({ categories, selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      <Chip label="全部" active={selected === null} onClick={() => onChange(null)} />
      {categories.map(cat => (
        <Chip
          key={cat.id}
          label={cat.name}
          active={selected === cat.id}
          onClick={() => onChange(cat.id)}
        />
      ))}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150 ${
        active
          ? 'bg-foreground text-card border-transparent'
          : 'bg-card text-muted border border-border/80'
      }`}
    >
      {label}
    </motion.button>
  )
}
