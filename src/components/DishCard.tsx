'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { Dish } from '@/types'
import { useCart } from '@/context/CartContext'

const THUMB_COLORS = [
  'bg-amber-100',
  'bg-red-100',
  'bg-green-100',
  'bg-sky-100',
  'bg-purple-100',
  'bg-orange-100',
]

function thumbColor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return THUMB_COLORS[n % THUMB_COLORS.length]
}

export default function DishCard({ dish }: { dish: Dish }) {
  const { addItem, getQty } = useCart()
  const qty = getQty(dish.id)

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-card rounded-2xl border border-border/60 flex items-center gap-3 p-3"
    >
      {/* Thumbnail */}
      <Link href={`/dish/${dish.id}`} className="flex-shrink-0">
        <div className="relative w-[62px] h-[62px] rounded-[14px] overflow-hidden">
          {dish.image_url ? (
            <Image
              src={dish.image_url}
              alt={dish.name}
              fill
              className="object-cover"
              sizes="62px"
            />
          ) : (
            <div
              className={`w-full h-full ${thumbColor(dish.id)} flex items-center justify-center text-3xl`}
            >
              🍽
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <Link href={`/dish/${dish.id}`} className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] leading-snug">{dish.name}</p>
        {dish.description && (
          <p className="text-muted text-[13px] mt-0.5 truncate">{dish.description}</p>
        )}
        <div className="flex items-center gap-1 mt-1.5 text-muted text-[12px]">
          {dish.cooking_time && (
            <>
              <Clock size={11} />
              <span>{dish.cooking_time} 分钟</span>
            </>
          )}
          {dish.cooking_time && dish.difficulty && <span>·</span>}
          {dish.difficulty && <span>{dish.difficulty}</span>}
        </div>
      </Link>

      {/* Add button — shows count when selected */}
      <motion.button
        whileTap={{ scale: qty === 0 ? 1.3 : 1.15 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        onClick={() => addItem(dish)}
        aria-label={qty > 0 ? `已选 ${qty} 份，再加一份` : '加入菜单'}
        className={`flex-shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
          qty > 0
            ? 'bg-foreground text-card'
            : 'bg-border text-foreground'
        }`}
      >
        {qty > 0 ? qty : <span className="text-[18px] font-light leading-none">+</span>}
      </motion.button>
    </motion.div>
  )
}
