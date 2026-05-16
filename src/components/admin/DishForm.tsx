'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, X, ImageIcon, Upload } from 'lucide-react'
import type { Category, DishDetail } from '@/types'

interface IngredientRow { name: string; amount: string }

export interface DishFormValues {
  name: string
  category_id: string | null
  description: string
  cooking_time: number | null
  difficulty: '简单' | '中等' | '较难'
  is_available: boolean
  steps: string[]
  ingredients: IngredientRow[]
  image_url: string | null
}

interface Props {
  initial?: DishDetail
  categories: Category[]
  saving: boolean
  onSave: (values: DishFormValues, imageFile: File | null) => void
}

async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        0.82
      )
    }
    img.src = url
  })
}

const DIFFICULTIES = ['简单', '中等', '较难'] as const

const fieldCls = 'w-full bg-background rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted'
const sectionLabel = 'text-[13px] font-medium'

export default function DishForm({ initial, categories, saving, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category_id ?? null)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [cookingTime, setCookingTime] = useState(initial?.cooking_time?.toString() ?? '')
  const [difficulty, setDifficulty] = useState<'简单' | '中等' | '较难'>(initial?.difficulty ?? '简单')
  const [isAvailable, setIsAvailable] = useState(initial?.is_available ?? true)
  const [steps, setSteps] = useState<string[]>(initial?.steps?.length ? initial.steps : [''])
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initial?.ingredients?.length
      ? initial.ingredients.map(i => ({ name: i.name, amount: i.amount ?? '' }))
      : [{ name: '', amount: '' }]
  )
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setImageFile(compressed)
    setImagePreview(URL.createObjectURL(compressed))
    e.target.value = ''
  }

  function updateIngredient(i: number, field: 'name' | 'amount', val: string) {
    setIngredients(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }
  function removeIngredient(i: number) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateStep(i: number, val: string) {
    setSteps(prev => prev.map((s, idx) => idx === i ? val : s))
  }
  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit() {
    onSave({
      name,
      category_id: categoryId,
      description,
      cooking_time: cookingTime ? parseInt(cookingTime) : null,
      difficulty,
      is_available: isAvailable,
      steps: steps.filter(s => s.trim()),
      ingredients: ingredients.filter(i => i.name.trim()),
      image_url: imageUrl,
    }, imageFile)
  }

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Photo */}
      <div>
        <p className={`${sectionLabel} mb-2`}>菜品照片</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-[76px] h-[76px] rounded-[14px] flex-shrink-0 overflow-hidden border border-dashed border-border bg-background flex items-center justify-center text-muted"
          >
            {imagePreview ? (
              <Image src={imagePreview} alt="preview" width={76} height={76} className="object-cover w-full h-full" unoptimized />
            ) : (
              <ImageIcon size={24} />
            )}
          </button>
          <div className="flex-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-background rounded-xl py-2.5 text-sm font-medium"
            >
              <Upload size={14} />
              选择照片上传
            </button>
            <p className="text-[11px] text-muted mt-2">建议 1:1 正方形，自动压缩</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      </div>

      {/* Name */}
      <div>
        <p className={`${sectionLabel} mb-2`}>菜名</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="如：番茄炒蛋"
          className={fieldCls}
        />
      </div>

      {/* Category */}
      <div>
        <p className={`${sectionLabel} mb-2`}>类别</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const active = cat.id === categoryId
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => setCategoryId(active ? null : cat.id)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium border ${
                  active
                    ? 'bg-foreground text-card border-transparent'
                    : 'bg-card text-muted border-border/80'
                }`}
              >
                {cat.name}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className={`${sectionLabel} mb-2`}>
          简介 <span className="text-[11px] text-muted font-normal">顾客详情页第一眼看到</span>
        </p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="一句话描述这道菜的口味和特点"
          rows={2}
          className={`${fieldCls} resize-none`}
        />
      </div>

      {/* Cooking time + Difficulty */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className={`${sectionLabel} mb-2`}>耗时（分钟）</p>
          <input
            type="number"
            value={cookingTime}
            onChange={e => setCookingTime(e.target.value)}
            placeholder="10"
            min={1}
            className={fieldCls}
          />
        </div>
        <div className="flex-1">
          <p className={`${sectionLabel} mb-2`}>难度</p>
          <div className="flex gap-1.5">
            {DIFFICULTIES.map(d => {
              const active = d === difficulty
              return (
                <motion.button
                  key={d}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-medium border ${
                    active
                      ? 'bg-foreground text-card border-transparent'
                      : 'bg-background text-muted border-border/60'
                  }`}
                >
                  {d}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={sectionLabel}>所需食材</p>
          <button
            onClick={() => setIngredients(prev => [...prev, { name: '', amount: '' }])}
            className="flex items-center gap-1 text-[12px] text-muted bg-background rounded-lg px-2.5 py-1.5"
          >
            <Plus size={12} />
            加一项
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={row.name}
                onChange={e => updateIngredient(i, 'name', e.target.value)}
                placeholder="食材"
                className="flex-[2] bg-background rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted"
              />
              <input
                value={row.amount}
                onChange={e => updateIngredient(i, 'amount', e.target.value)}
                placeholder="用量"
                className="flex-[1.3] bg-background rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted"
              />
              <button
                onClick={() => removeIngredient(i)}
                className="w-9 flex-shrink-0 bg-background rounded-xl flex items-center justify-center text-red-400"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={sectionLabel}>做法步骤</p>
          <button
            onClick={() => setSteps(prev => [...prev, ''])}
            className="flex items-center gap-1 text-[12px] text-muted bg-background rounded-lg px-2.5 py-1.5"
          >
            <Plus size={12} />
            加一步
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-foreground text-card flex items-center justify-center text-[12px] font-semibold flex-shrink-0 mt-2.5">
                {i + 1}
              </div>
              <textarea
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                placeholder={`第 ${i + 1} 步做法`}
                rows={2}
                className="flex-1 bg-background rounded-xl px-3 py-2.5 text-sm outline-none placeholder:text-muted resize-none"
              />
              <button
                onClick={() => removeStep(i)}
                className="w-9 flex-shrink-0 bg-background rounded-xl flex items-center justify-center text-red-400 mt-1 py-2.5"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* is_available toggle */}
      <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium">立即上架</p>
          <p className="text-[11px] text-muted mt-0.5">关闭则保存为草稿，顾客看不到</p>
        </div>
        <button
          onClick={() => setIsAvailable(v => !v)}
          className={`relative w-[44px] h-[26px] rounded-full flex-shrink-0 transition-colors duration-200 ${
            isAvailable ? 'bg-foreground' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-[3px] w-5 h-5 rounded-full bg-card transition-all duration-200 ${
              isAvailable ? 'left-[21px]' : 'left-[3px]'
            }`}
          />
        </button>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-background/90 backdrop-blur-xl border-t border-border/40 flex gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          disabled={saving || !name.trim()}
          onClick={handleSubmit}
          className="flex-1 bg-foreground text-card rounded-2xl py-[13px] font-semibold text-[15px] disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存并发布'}
        </motion.button>
      </div>
    </div>
  )
}
