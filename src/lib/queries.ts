import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Category,
  Dish,
  DishDetail,
  DishFormData,
  Ingredient,
  MenuList,
  MenuItem,
} from '@/types'

// ─── 顾客端 ───────────────────────────────────────────────────

export async function getCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as Category[]
}

export async function getAvailableDishes(
  supabase: SupabaseClient,
  categoryId?: string
): Promise<Dish[]> {
  let query = supabase
    .from('dishes')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  const { data, error } = await query
  if (error) throw error
  return data as Dish[]
}

export async function getDishDetail(
  supabase: SupabaseClient,
  id: string
): Promise<DishDetail> {
  const { data, error } = await supabase
    .from('dish_details')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as DishDetail
}

export async function submitMenuList(
  supabase: SupabaseClient,
  items: MenuItem[],
  note: string
): Promise<MenuList> {
  const { data, error } = await supabase
    .from('menu_lists')
    .insert({ items, note, status: 'submitted' })
    .select()
    .single()
  if (error) throw error
  return data as MenuList
}

export async function getMenuHistory(supabase: SupabaseClient): Promise<MenuList[]> {
  const { data, error } = await supabase
    .from('menu_lists')
    .select('*')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return data as MenuList[]
}

export async function deleteMenuList(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('menu_lists').delete().eq('id', id)
  if (error) throw error
}

// ─── 管理端 ───────────────────────────────────────────────────

export async function getAllDishes(supabase: SupabaseClient): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as Dish[]
}

export async function createDish(
  supabase: SupabaseClient,
  formData: DishFormData
): Promise<Dish> {
  const { ingredients, ...dishData } = formData
  const { data, error } = await supabase
    .from('dishes')
    .insert(dishData)
    .select()
    .single()
  if (error) throw error
  const dish = data as Dish
  await syncDishIngredients(supabase, dish.id, ingredients)
  return dish
}

export async function updateDish(
  supabase: SupabaseClient,
  id: string,
  formData: Partial<DishFormData>
): Promise<Dish> {
  const { ingredients, ...dishData } = formData
  const { data, error } = await supabase
    .from('dishes')
    .update(dishData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if (ingredients !== undefined) {
    await syncDishIngredients(supabase, id, ingredients)
  }
  return data as Dish
}

export async function deleteDish(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('dishes').delete().eq('id', id)
  if (error) throw error
}

async function getOrCreateIngredient(
  supabase: SupabaseClient,
  name: string
): Promise<Ingredient> {
  const { data: existing } = await supabase
    .from('ingredients')
    .select('*')
    .eq('name', name)
    .maybeSingle()
  if (existing) return existing as Ingredient

  const { data, error } = await supabase
    .from('ingredients')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data as Ingredient
}

export async function syncDishIngredients(
  supabase: SupabaseClient,
  dishId: string,
  ingredients: { name: string; amount: string }[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('dish_ingredients')
    .delete()
    .eq('dish_id', dishId)
  if (deleteError) throw deleteError

  if (ingredients.length === 0) return

  const rows = await Promise.all(
    ingredients.map(async ({ name, amount }, index) => {
      const ingredient = await getOrCreateIngredient(supabase, name)
      return {
        dish_id: dishId,
        ingredient_id: ingredient.id,
        amount,
        sort_order: index,
      }
    })
  )

  const { error } = await supabase.from('dish_ingredients').insert(rows)
  if (error) throw error
}

export async function uploadDishImage(
  supabase: SupabaseClient,
  file: File,
  dishId: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${dishId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('dish-images')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('dish-images').getPublicUrl(path)
  return data.publicUrl
}
