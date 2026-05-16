'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { submitMenuList } from '@/lib/queries'
import { useCart } from '@/context/CartContext'

export default function MenuPage() {
  const { items, updateQty, clearCart, toMenuItems } = useCart()
  const router = useRouter()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (items.length === 0) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      await submitMenuList(supabase, toMenuItems(), note)
      clearCart()
      router.push('/history')
    } catch {
      alert('提交失败，请稍后重试')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="px-4 pt-14 pb-4 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={() => router.back()}
          className="w-[32px] h-[32px] rounded-full bg-border flex items-center justify-center"
        >
          <ChevronLeft size={18} />
        </motion.button>
        <h1 className="text-[22px] font-semibold">确认菜单</h1>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted">
          <p className="text-sm">还没有选菜</p>
          <button
            onClick={() => router.push('/')}
            className="font-medium text-sm text-foreground"
          >
            去选菜
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {/* Item list */}
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border">
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={item.dish.id}
                  layout
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {item.dish.image_url && (
                    <div className="relative w-[40px] h-[40px] rounded-[10px] overflow-hidden flex-shrink-0">
                      <Image
                        src={item.dish.image_url}
                        alt={item.dish.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <span className="flex-1 font-medium text-sm">{item.dish.name}</span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      onClick={() => updateQty(item.dish.id, -1)}
                      className="w-[26px] h-[26px] rounded-full border border-border flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </motion.button>
                    <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      onClick={() => updateQty(item.dish.id, 1)}
                      className="w-[26px] h-[26px] rounded-full bg-foreground text-card flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Note */}
          <div className="bg-card rounded-2xl border border-border/60 p-4">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="备注（如：今天有客人）"
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-background">
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full bg-foreground text-card rounded-2xl py-[14px] font-semibold text-[15px] disabled:opacity-50"
          >
            {submitting ? '提交中...' : `提交菜单`}
          </motion.button>
        </div>
      )}
    </div>
  )
}
