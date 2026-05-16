'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function doLogin() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('邮箱或密码错误')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm text-muted mb-1">管理员后台</p>
          <h1 className="text-[26px] font-semibold">登录</h1>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); doLogin() }}
          className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border"
        >
          <div className="px-4 py-3.5">
            <p className="text-[11px] text-muted mb-1">邮箱</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              className="w-full text-sm bg-transparent outline-none"
            />
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[11px] text-muted mb-1">密码</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full text-sm bg-transparent outline-none"
            />
          </div>
        </form>

        {error && (
          <p className="text-center text-sm text-red-500 mt-3">{error}</p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={doLogin}
          disabled={loading}
          className="mt-4 w-full bg-foreground text-card rounded-2xl py-3.5 font-semibold text-[15px] disabled:opacity-50"
        >
          {loading ? '登录中...' : '登录'}
        </motion.button>
      </div>
    </div>
  )
}
