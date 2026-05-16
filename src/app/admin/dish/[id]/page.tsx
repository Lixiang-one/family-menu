'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCategories, getDishDetail, updateDish, uploadDishImage } from '@/lib/queries'
import DishForm, { type DishFormValues } from '@/components/admin/DishForm'
import type { Category, DishDetail } from '@/types'

export default function EditDishPage() {
  const { id } = useParams<{ id: string }>()
  const [dish, setDish] = useState<DishDetail | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    Promise.all([getDishDetail(supabase, id), getCategories(supabase)]).then(
      ([d, cats]) => {
        setDish(d)
        setCategories(cats)
        setLoading(false)
      }
    ).catch(() => setLoading(false))
  }, [id])

  async function handleSave(values: DishFormValues, imageFile: File | null) {
    setSaving(true)
    try {
      const supabase = createClient()
      let imageUrl = values.image_url
      if (imageFile) {
        imageUrl = await uploadDishImage(supabase, imageFile, id)
      }
      await updateDish(supabase, id, { ...values, image_url: imageUrl })
      router.push('/admin')
    } catch {
      alert('保存失败，请稍后重试')
      setSaving(false)
    }
  }

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
        <button onClick={() => router.back()} className="font-medium text-foreground">返回</button>
      </div>
    )
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
          <h1 className="text-[20px] font-semibold leading-tight">编辑菜品</h1>
        </div>
      </header>

      <div className="py-4">
        <DishForm
          initial={dish}
          categories={categories}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
