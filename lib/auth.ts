import { supabase } from './supabase'

export async function signUp(
  email: string, password: string,
  name: string, role: 'doctor' | 'patient'
) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, role } }
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  return { ...user, profile }
}