'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCategories, getAvailableDishes } from '@/lib/queries'
import type { Category, Dish } from '@/types'
import CategoryFilter from '@/components/CategoryFilter'
import DishCard from '@/components/DishCard'
import { History, UtensilsCrossed } from 'lucide-react'

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    Promise.all([getCategories(supabase), getAvailableDishes(supabase)]).then(
      ([cats, dishs]) => {
        setCategories(cats)
        setDishes(dishs)
        setLoading(false)
      }
    )
  }, [])

  const filtered = selected ? dishes.filter(d => d.category_id === selected) : dishes

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-4 pt-14 pb-3 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">今天想吃点什么</p>
          <h1 className="text-[28px] font-semibold tracking-tight mt-0.5">家的菜单</h1>
        </div>
        <button
          onClick={() => router.push('/history')}
          className="flex items-center gap-1.5 text-sm border border-border rounded-2xl px-3 py-2 text-muted"
        >
          <History size={14} />
          历史
        </button>
      </header>

      <CategoryFilter categories={categories} selected={selected} onChange={setSelected} />

      <div className="px-4 flex flex-col gap-3 pt-1">
        {loading ? (
          <div className="py-20 text-center text-muted text-sm">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-muted">
            <UtensilsCrossed size={36} className="opacity-30" />
            <span className="text-sm">暂无菜品</span>
          </div>
        ) : (
          filtered.map(dish => <DishCard key={dish.id} dish={dish} />)
        )}
      </div>
    </div>
  )
}
