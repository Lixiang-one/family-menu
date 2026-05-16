export interface Category {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Ingredient {
  id: string
  name: string
  created_at: string
}

export interface Dish {
  id: string
  name: string
  category_id: string | null
  description: string | null
  image_url: string | null
  cooking_time: number | null
  difficulty: '简单' | '中等' | '较难' | null
  steps: string[]
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DishIngredientRow {
  id: string
  dish_id: string
  ingredient_id: string
  amount: string | null
  sort_order: number
}

export interface DishIngredientDetail {
  name: string
  amount: string | null
}

export interface DishDetail {
  id: string
  name: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  difficulty: '简单' | '中等' | '较难' | null
  steps: string[]
  is_available: boolean
  sort_order: number
  category_id: string | null
  category_name: string | null
  ingredients: DishIngredientDetail[]
}

export interface MenuItem {
  dish_id: string
  qty: number
}

export interface MenuList {
  id: string
  items: MenuItem[]
  note: string | null
  status: 'submitted' | 'cooking' | 'done'
  submitted_at: string
}

export type CartDish = {
  id: string
  name: string
  image_url: string | null
}

export interface CartItem {
  dish: CartDish
  qty: number
}

export type DishFormData = {
  name: string
  category_id: string | null
  description: string
  image_url: string | null
  cooking_time: number | null
  difficulty: '简单' | '中等' | '较难'
  steps: string[]
  is_available: boolean
  sort_order: number
  ingredients: { name: string; amount: string }[]
}
