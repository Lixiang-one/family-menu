'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function CartBar() {
  const { totalCount } = useCart()
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/menu' || pathname.startsWith('/admin')) return null

  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-4 left-3 right-3 z-50"
        >
          <div className="bg-card border border-border/80 rounded-[18px] px-4 py-3 flex items-center justify-between shadow-lg shadow-black/10">
            <div>
              <p className="text-xs text-muted">当前菜单</p>
              <p className="text-[15px] font-semibold mt-0.5">已选 {totalCount} 道菜</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              onClick={() => router.push('/menu')}
              className="flex items-center gap-1.5 bg-foreground text-card px-4.5 py-2.25 rounded-xl text-[14px] font-semibold"
            >
              去确认
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
