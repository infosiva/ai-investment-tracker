import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' })

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const origin = req.headers.get('origin') || 'https://trackwealth.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&upgraded=1`,
      cancel_url: `${origin}/?cancelled=1`,
      metadata: { product: 'wealthpilot' },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
