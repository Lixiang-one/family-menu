'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, Clock, ChefHat, Plus, Minus } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDishDetail } from '@/lib/queries'
import { useCart } from '@/context/CartContext'
import type { DishDetail } from '@/types'

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [dish, setDish] = useState<DishDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { addItem, updateQty, getQty } = useCart()

  useEffect(() => {
    const supabase = createClient()
    getDishDetail(supabase, id)
      .then(setDish)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        加载中...
      </div>
    )
  }

  if (!dish) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted">
        <p>菜品不存在</p>
        <button onClick={() => router.back()} className="font-medium text-foreground">
          返回
        </button>
      </div>
    )
  }

  const qty = getQty(dish.id)

  return (
    <div className="min-h-screen pb-28">
      {/* Hero image */}
      <div className="relative aspect-[4/3] bg-border">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm">
            暂无图片
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={() => router.back()}
          className="absolute top-12 left-4 bg-black/30 backdrop-blur-sm text-white rounded-full p-2"
        >
          <ChevronLeft size={22} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-5">
        {/* Title & meta */}
        <div>
          <h1 className="text-[22px] font-semibold">{dish.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted text-sm">
            {dish.cooking_time && (
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {dish.cooking_time} 分钟
              </span>
            )}
            {dish.difficulty && (
              <span className="flex items-center gap-1.5">
                <ChefHat size={13} />
                {dish.difficulty}
              </span>
            )}
            {dish.category_name && (
              <span className="text-xs text-muted">{dish.category_name}</span>
            )}
          </div>
          {dish.description && (
            <p className="text-muted text-sm mt-3 leading-relaxed">{dish.description}</p>
          )}
        </div>

        {/* Meta cards */}
        {(dish.cooking_time || dish.difficulty) && (
          <div className="flex gap-2">
            {dish.cooking_time && (
              <div className="flex-1 bg-background rounded-[10px] p-3 text-center">
                <p className="text-xs text-muted">耗时</p>
                <p className="text-[15px] font-semibold mt-0.5">{dish.cooking_time} 分钟</p>
              </div>
            )}
            {dish.difficulty && (
              <div className="flex-1 bg-background rounded-[10px] p-3 text-center">
                <p className="text-xs text-muted">难度</p>
                <p className="text-[15px] font-semibold mt-0.5">{dish.difficulty}</p>
              </div>
            )}
          </div>
        )}

        {/* Ingredients */}
        {dish.ingredients.length > 0 && (
          <section>
            <h2 className="font-semibold text-base mb-3">所需食材</h2>
            <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border overflow-hidden">
              {dish.ingredients.map((ing, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3 text-sm">
                  <span>{ing.name}</span>
                  <span className="text-muted">{ing.amount}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        {dish.steps.length > 0 && (
          <section>
            <h2 className="font-semibold text-base mb-3">做法步骤</h2>
            <div className="space-y-3">
              {dish.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-[22px] h-[22px] rounded-full bg-foreground text-card flex items-center justify-center text-[12px] font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/80 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 px-4 py-4">
        {qty === 0 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => addItem(dish)}
            className="w-full bg-foreground text-card rounded-2xl py-[14px] font-semibold flex items-center justify-center gap-2 text-[15px]"
          >
            <Plus size={16} />
            加入当前菜单
          </motion.button>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">已选 {qty} 份</span>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={() => updateQty(dish.id, -1)}
                className="w-10 h-10 rounded-full bg-border flex items-center justify-center"
              >
                <Minus size={16} />
              </motion.button>
              <span className="w-6 text-center font-bold text-lg">{qty}</span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                onClick={() => addItem(dish)}
                className="w-10 h-10 rounded-full bg-foreground text-card flex items-center justify-center"
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
