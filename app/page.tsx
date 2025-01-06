// app/page.tsx
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Index() {
  // Create the Supabase client - notice we don't pass any parameters
  const supabase = await createClient()
  
  // Now we can use the client to get the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Welcome to [Your App Name]</h1>
        {!user ? (
          <p>Please sign in to continue</p>
        ) : (
          <p>Welcome back, {user.email}</p>
        )}
      </div>
    </div>
  )
}
