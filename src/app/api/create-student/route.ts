import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, phone, seatNumber, collectFee, discount, paymentMode, adminId } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch current global fee
    const { data: settings } = await supabaseAdmin.from('app_settings').select('monthly_fee').single();
    const baseFee = settings?.monthly_fee || 500;

    // 2. Create the Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true 
    });

    if (authError) throw authError;

    // 3. Determine Subscription End Date
    const subEnd = new Date();
    if (collectFee) {
      subEnd.setDate(subEnd.getDate() + 30); // Add 30 days if they pay now
    }

    // 4. Upsert Profile
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        seat_number: seatNumber || null,
        role: 'student',
        subscription_end_date: subEnd.toISOString() 
      });

      if (profileError) throw profileError;

      // 5. Insert Payment Record (If fee collected)
      if (collectFee) {
        const finalAmount = baseFee - (Number(discount) || 0);
        await supabaseAdmin.from('payments').insert({
          user_id: authData.user.id,
          admin_id: adminId || null,
          amount: finalAmount,
          payment_mode: paymentMode,
          payment_for_month: '1st Month (Joining)',
          remarks: discount ? `Discount: ₹${discount}` : 'New Registration'
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Student created and fee processed!' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}