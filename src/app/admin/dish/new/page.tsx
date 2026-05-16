'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCategories, createDish, uploadDishImage, updateDish } from '@/lib/queries'
import DishForm, { type DishFormValues } from '@/components/admin/DishForm'
import type { Category } from '@/types'

export default function NewDishPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    getCategories(supabase).then(setCategories)
  }, [])

  async function handleSave(values: DishFormValues, imageFile: File | null) {
    setSaving(true)
    try {
      const supabase = createClient()
      const dish = await createDish(supabase, {
        ...values,
        sort_order: 0,
      })
      if (imageFile) {
        const url = await uploadDishImage(supabase, imageFile, dish.id)
        await updateDish(supabase, dish.id, { image_url: url })
      }
      router.push('/admin')
    } catch {
      alert('保存失败，请稍后重试')
      setSaving(false)
    }
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
        <div>
          <p className="text-xs text-muted">管理员后台</p>
          <h1 className="text-[20px] font-semibold leading-tight">新增菜品</h1>
        </div>
      </header>

      <div className="py-4">
        <DishForm
          categories={categories}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
