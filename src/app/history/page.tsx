'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Trash2, RotateCcw, ClipboardList } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMenuHistory, deleteMenuList, getAvailableDishes } from '@/lib/queries'
import { useCart } from '@/context/CartContext'
import type { Dish, MenuList } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  submitted: '已提交',
  cooking: '制作中',
  done: '已完成',
}

const STATUS_CLASS: Record<string, string> = {
  submitted: 'bg-sky-50 text-sky-600',
  cooking: 'bg-violet-50 text-violet-600',
  done: 'bg-green-50 text-green-600',
}

export default function HistoryPage() {
  const [history, setHistory] = useState<MenuList[]>([])
  const [dishMap, setDishMap] = useState<Record<string, Dish>>({})
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const router = useRouter()
  const { loadItems } = useCart()

  useEffect(() => {
    const supabase = createClient()
    Promise.all([getMenuHistory(supabase), getAvailableDishes(supabase)]).then(
      ([hist, dishes]) => {
        setHistory(hist)
        setDishMap(Object.fromEntries(dishes.map(d => [d.id, d])))
        setLoading(false)
      }
    )
  }, [])

  async function confirmDelete(id: string) {
    const supabase = createClient()
    await deleteMenuList(supabase, id)
    setHistory(prev => prev.filter(m => m.id !== id))
    setDeleteTarget(null)
  }

  function handleReorder(menu: MenuList) {
    const cartItems = menu.items
      .filter(item => dishMap[item.dish_id])
      .map(item => ({ dish: dishMap[item.dish_id], qty: item.qty }))
    loadItems(cartItems)
    router.push('/menu')
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 pt-12 pb-4 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={() => router.back()}
          className="p-1 -ml-1"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <h1 className="text-xl font-bold">历史清单</h1>
      </header>

      {loading ? (
        <div className="py-20 text-center text-muted text-sm">加载中...</div>
      ) : history.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-muted">
          <ClipboardList size={36} className="opacity-30" />
          <span className="text-sm">暂无历史记录</span>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          <AnimatePresence>
            {history.map(menu => (
              <motion.div
                key={menu.id}
                layout
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">
                    {new Date(menu.submitted_at).toLocaleString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CLASS[menu.status] ?? 'bg-border text-muted'}`}
                  >
                    {STATUS_LABEL[menu.status] ?? menu.status}
                  </span>
                </div>

                {/* Dish list */}
                <div className="flex flex-wrap gap-1.5">
                  {menu.items.map(item => (
                    <span
                      key={item.dish_id}
                      className="text-sm bg-background rounded-lg px-2.5 py-1"
                    >
                      {dishMap[item.dish_id]?.name ?? '已下架'} × {item.qty}
                    </span>
                  ))}
                </div>

                {/* Note */}
                {menu.note && (
                  <p className="text-xs text-muted bg-background rounded-xl px-3 py-2 leading-relaxed">
                    备注：{menu.note}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    onClick={() => handleReorder(menu)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-medium"
                  >
                    <RotateCcw size={13} />
                    重新下单
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    onClick={() => setDeleteTarget(menu.id)}
                    className="flex items-center justify-center gap-1.5 border border-red-200 text-red-500 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <Trash2 size={13} />
                    删除
                  </motion.button>
                </div>
              </motion.div>
            ))}
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
              <p className="text-sm text-muted text-center">删除后不可恢复</p>
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
