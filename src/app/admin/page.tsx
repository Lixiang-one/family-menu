'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Clock, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAllDishes, deleteDish, getCategories } from '@/lib/queries'
import type { Dish, Category } from '@/types'

const THUMB_COLORS = [
  'bg-amber-100', 'bg-red-100', 'bg-green-100',
  'bg-sky-100', 'bg-purple-100', 'bg-orange-100',
]

function thumbColor(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return THUMB_COLORS[h % THUMB_COLORS.length]
}

export default function AdminPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [catMap, setCatMap] = useState<Record<string, Category>>({})
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    Promise.all([getAllDishes(supabase), getCategories(supabase)]).then(
      ([d, cats]) => {
        setDishes(d)
        setCatMap(Object.fromEntries(cats.map(c => [c.id, c])))
        setLoading(false)
      }
    )
  }, [])

  async function confirmDelete(id: string) {
    const supabase = createClient()
    await deleteDish(supabase, id)
    setDishes(prev => prev.filter(d => d.id !== id))
    setDeleteTarget(null)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">管理员后台</p>
          <h1 className="text-[22px] font-semibold mt-0.5">菜品管理</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={handleLogout}
          className="p-2 text-muted"
        >
          <LogOut size={18} />
        </motion.button>
      </header>

      <div className="px-4 pt-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => router.push('/admin/dish/new')}
          className="w-full bg-foreground text-card rounded-2xl py-[14px] font-semibold text-[15px] flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          新增菜品
        </motion.button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-sm">加载中...</div>
      ) : (
        <div className="px-4 space-y-2">
          <AnimatePresence>
            {dishes.map(dish => {
              const cat = dish.category_id ? catMap[dish.category_id] : null
              return (
                <motion.div
                  key={dish.id}
                  layout
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.2 }}
                  className={`bg-card rounded-2xl border border-border/60 px-4 py-3 flex items-center gap-3 ${!dish.is_available ? 'opacity-50' : ''}`}
                >
                  <div className={`w-[46px] h-[46px] rounded-[10px] flex-shrink-0 overflow-hidden ${dish.image_url ? '' : thumbColor(dish.id)}`}>
                    {dish.image_url ? (
                      <Image src={dish.image_url} alt={dish.name} width={46} height={46} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{dish.name}</p>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      {cat?.name ?? '未分类'}
                      {dish.cooking_time && (
                        <>
                          <span>·</span>
                          <Clock size={10} className="inline" />
                          {dish.cooking_time} 分钟
                        </>
                      )}
                      {!dish.is_available && <span className="ml-1 text-red-400">已下架</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      onClick={() => router.push(`/admin/dish/${dish.id}`)}
                      className="w-9 h-9 rounded-xl bg-background flex items-center justify-center text-muted"
                    >
                      <Pencil size={15} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      onClick={() => setDeleteTarget(dish.id)}
                      className="w-9 h-9 rounded-xl bg-background flex items-center justify-center text-red-400"
                    >
                      <Trash2 size={15} />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirmation sheet */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl px-6 pt-6 pb-10 space-y-4"
            >
              <h3 className="font-semibold text-center text-lg">确认删除？</h3>
              <p className="text-sm text-muted text-center">删除后菜品信息将无法恢复</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 border border-border rounded-2xl py-3.5 font-medium text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => confirmDelete(deleteTarget)}
                  className="flex-1 bg-red-500 text-white rounded-2xl py-3.5 font-medium text-sm"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
