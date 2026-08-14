'use client'
import { useState } from 'react'
import { Trash2, MessageCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { removeLine, updateQty, clearStoreCart } from '@/lib/features/cart/cartSlice'
import { buildWaLink } from '@/lib/whatsapp'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function OrderSummary({ store }) {
    const dispatch = useDispatch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const items = useSelector(s => s.cart.cartByStore?.[store.id]?.items) || []
    const total = items.reduce((acc, it) => acc + it.price * it.qty, 0)
    const [submitting, setSubmitting] = useState(false)

    const buildMessage = () => {
        const lines = []
        lines.push(`Hello ${store.name},`)
        lines.push('')
        lines.push(`I'd like to order:`)
        items.forEach((it, i) => {
            const tags = []
            if (it.size) tags.push(`Size: ${it.size}`)
            if (it.color) tags.push(`Color: ${it.color}`)
            const tagStr = tags.length ? ` | ${tags.join(' | ')}` : ''
            lines.push(`${i + 1}. ${it.name}${tagStr} | Qty: ${it.qty} | ${currency}${it.price}`)
        })
        lines.push('')
        lines.push(`Total: ${currency}${total.toFixed(2)}`)
        lines.push('')
        lines.push(`Store: ${store.name} (/${store.username})`)
        return lines.join('\n')
    }

    const onOrder = async () => {
        if (!store.whatsapp) {
            return toast.error('This store has not set a WhatsApp number yet')
        }
        try {
            setSubmitting(true)
            await axios.post('/api/orders', {
                items: items.map(it => ({
                    id: it.productId,
                    quantity: it.qty,
                    size: it.size,
                    color: it.color,
                })),
            })
        } catch (e) {
            console.warn('Order log failed:', e?.response?.data || e.message)
        } finally {
            setSubmitting(false)
        }
        window.open(buildWaLink(store.whatsapp, buildMessage()), '_blank')
        dispatch(clearStoreCart({ storeId: store.id }))
    }

    if (items.length === 0) {
        return (
            <div className="w-full lg:max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center">
                <p className="text-slate-500">Your cart is empty.</p>
            </div>
        )
    }

    return (
        <div className="w-full lg:max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-slate-700">
            <h2 className="text-lg font-semibold text-slate-800">Your order</h2>
            <p className="text-xs text-slate-400 mt-1">At {store.name}</p>

            <ul className="mt-5 space-y-3 max-h-80 overflow-auto pr-1">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-3 items-center border border-slate-100 rounded-xl p-2">
                        <div className="size-14 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center">
                            {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{it.name}</p>
                            <p className="text-xs text-slate-500">
                                {it.size ? `Size ${it.size}` : ''}{it.size && it.color ? ' · ' : ''}{it.color ? `Color ${it.color}` : ''}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                                <div className="inline-flex items-center rounded-full border border-slate-200 overflow-hidden text-xs">
                                    <button onClick={() => dispatch(updateQty({ storeId: store.id, index: i, qty: it.qty - 1 }))} className="px-2 py-0.5 text-slate-600">-</button>
                                    <span className="px-2">{it.qty}</span>
                                    <button onClick={() => dispatch(updateQty({ storeId: store.id, index: i, qty: it.qty + 1 }))} className="px-2 py-0.5 text-slate-600">+</button>
                                </div>
                                <p className="text-sm font-medium">{currency}{(it.price * it.qty).toFixed(2)}</p>
                            </div>
                        </div>
                        <button onClick={() => dispatch(removeLine({ storeId: store.id, index: i }))} className="text-slate-400 hover:text-red-500 p-1.5" aria-label="Remove">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
            </ul>

            <div className="mt-5 border-t border-slate-100 pt-4 flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">{currency}{total.toFixed(2)}</span>
            </div>

            <button
                onClick={onOrder}
                disabled={submitting}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-white text-sm font-medium shadow-sm hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: store.brandColor || '#10b981' }}
            >
                <MessageCircle size={16} /> {submitting ? 'Opening WhatsApp…' : 'Order on WhatsApp'}
            </button>

            <button
                onClick={() => dispatch(clearStoreCart({ storeId: store.id }))}
                className="mt-2 w-full text-xs text-slate-400 hover:text-red-500"
            >
                Clear cart
            </button>
        </div>
    )
}
