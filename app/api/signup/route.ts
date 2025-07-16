import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ychykjkwyrtfinvenypc.supabase.co',
  process.env.SUPABASE_KEY || 'your-key-here'
);

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  
  const { data, error } = await supabase
    .from('signups')
    .insert([
      { 
        email, 
        plan: 'founding',
        price: 99,
        created_at: new Date()
      }
    ]);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ success: true });
}