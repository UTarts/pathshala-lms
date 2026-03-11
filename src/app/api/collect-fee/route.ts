import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { studentId, adminId, amountPaid, paymentMode, monthsSelected, discount, newBalance, extendMonths } = await request.json();

    // Secure Admin Client (Bypasses RLS safely on the server)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Insert Payment Record
    const { data: newPay, error: payError } = await supabaseAdmin.from('payments').insert({
      user_id: studentId,
      admin_id: adminId || null,
      amount: amountPaid,
      payment_mode: paymentMode,
      payment_for_month: monthsSelected.join(', '), // Stores "Jan 26, Feb 26"
      remarks: discount > 0 ? `Discount: ₹${discount}` : ''
    }).select().single();

    if (payError) throw payError;

    // 2. Calculate new subscription end date
    const { data: profile } = await supabaseAdmin.from('profiles').select('subscription_end_date').eq('id', studentId).single();
    
    let newEndDate = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : new Date();
    // If expired, start from today
    if (newEndDate < new Date()) newEndDate = new Date();
    // Add 30 days for every month they are paying for
    if (extendMonths > 0) newEndDate.setDate(newEndDate.getDate() + (30 * extendMonths));

    // 3. Update Profile (Dues & Expiry)
    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      outstanding_balance: newBalance,
      subscription_end_date: extendMonths > 0 ? newEndDate.toISOString() : profile?.subscription_end_date
    }).eq('id', studentId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, payment: newPay });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}