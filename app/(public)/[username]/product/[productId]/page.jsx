'use client'
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import axios from "axios"
import toast from "react-hot-toast"
import { MessageCircle, ShoppingBag, StarIcon } from "lucide-react"
import PublicStoreNavbar from "@/components/store/PublicStoreNavbar"
import Loading from "@/components/Loading"
import { useDispatch } from "react-redux"
import { addToCart } from "@/lib/features/cart/cartSlice"
import { buildWaLink, sanitizeWhatsappNumber } from "@/lib/whatsapp"
import { useUser } from "@clerk/nextjs"

export default function PublicStoreProductPage() {
    const { username, productId } = useParams()
    const router = useRouter()
    const dispatch = useDispatch()
    const { user } = useUser()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [store, setStore] = useState(null)
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [mainImage, setMainImage] = useState(null)
    const [size, setSize] = useState('')
    const [color, setColor] = useState('')
    const [qty, setQty] = useState(1)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await axios.get(`/api/store/data?username=${username}`)
                const s = data.store
                const p = (s.Product || []).find(x => x.id === productId)
                if (!p || p.storeId !== s.id) {
                    toast.error('Product not available in this store')
                    router.replace(`/${username}`)
                    return
                }
                setStore(s)
                setProduct(p)
                setMainImage(p.images?.[0] || null)
            } catch (error) {
                toast.error(error?.response?.data?.error || 'Not found')
                router.replace(`/${username}`)
            } finally {
                setLoading(false)
            }
        }
        if (username && productId) fetch()
    }, [username, productId, router])

    if (loading) return <Loading />
    if (!store || !product) return null

    const brand = store.brandColor || '#10b981'

    const sizes = product.sizes || []
    const colors = product.colors || []

    const onAddToCart = () => {
        dispatch(addToCart({
            storeId: store.id,
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || null,
            },
            size: size || null,
            color: color || null,
            qty,
        }))
        toast.success('Added to cart')
    }

    const buildSingleMessage = () => {
        const lines = []
        lines.push(`Hello ${store.name},`)
        lines.push('')
        lines.push(`I'd like to order:`)
        lines.push(`- ${product.name}`)
        if (size) lines.push(`  Size: ${size}`)
        if (color) lines.push(`  Color: ${color}`)
        lines.push(`  Quantity: ${qty}`)
        lines.push(`  Price: ${currency}${product.price}`)
        lines.push('')
        lines.push(`Store: ${store.name} (/${store.username})`)
        return lines.join('\n')
    }

    const onOrderOnWhatsApp = async () => {
        if (!store.whatsapp) {
            return toast.error('This store has not set a WhatsApp number yet')
        }
        try {
            setSubmitting(true)
            // create in-app order log
            await axios.post('/api/orders', {
                items: [{
                    id: product.id,
                    quantity: qty,
                    size: size || null,
                    color: color || null,
                }],
            })
        } catch (e) {
            // proceed anyway — order is just a log
            console.warn('Order log failed (continuing to WhatsApp):', e?.response?.data || e.message)
        } finally {
            setSubmitting(false)
        }
        window.open(buildWaLink(store.whatsapp, buildSingleMessage()), '_blank')
    }

    return (
        <div>
            <PublicStoreNavbar store={store} search="" onSearch={() => {}} />

            <div className="mx-6 max-w-6xl mt-6">
                <Link href={`/${store.username}`} className="text-sm text-slate-500 hover:text-slate-700">← Back to {store.name}</Link>
            </div>

            <div className="mx-6 max-w-6xl mt-4 grid lg:grid-cols-2 gap-10">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex sm:flex-col gap-2 order-2 sm:order-1">
                        {(product.images || []).map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(img)}
                                className={`size-16 rounded-lg overflow-hidden border ${mainImage === img ? 'border-2' : 'border-slate-200'}`}
                                style={mainImage === img ? { borderColor: brand } : {}}
                            >
                                <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 aspect-square bg-slate-50 rounded-2xl overflow-hidden order-1 sm:order-2 border border-slate-100">
                        {mainImage && <Image src={mainImage} alt={product.name} width={800} height={800} className="w-full h-full object-cover" />}
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">{product.name}</h1>
                    <p className="text-xs text-slate-400 mt-1">{product.category}</p>

                    <div className="mt-4 flex items-end gap-3">
                        <p className="text-3xl font-semibold text-slate-900">{currency}{product.price}</p>
                        {product.mrp > product.price && (
                            <p className="text-sm text-slate-400 line-through mb-1">{currency}{product.mrp}</p>
                        )}
                    </div>

                    {product.description && (
                        <p className="text-sm text-slate-600 mt-4 leading-relaxed">{product.description}</p>
                    )}

                    {sizes.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm font-medium text-slate-700 mb-2">Size</p>
                            <div className="flex flex-wrap gap-2">
                                {sizes.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSize(s)}
                                        className={`px-3 py-1.5 rounded-full text-sm border ${size === s ? 'text-white' : 'text-slate-700'}`}
                                        style={size === s ? { backgroundColor: brand, borderColor: brand } : { borderColor: '#e2e8f0' }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {colors.length > 0 && (
                        <div className="mt-5">
                            <p className="text-sm font-medium text-slate-700 mb-2">Color</p>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`px-3 py-1.5 rounded-full text-sm border ${color === c ? 'text-white' : 'text-slate-700'}`}
                                        style={color === c ? { backgroundColor: brand, borderColor: brand } : { borderColor: '#e2e8f0' }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex items-center gap-3">
                        <p className="text-sm font-medium text-slate-700">Quantity</p>
                        <div className="inline-flex items-center rounded-full border border-slate-200 overflow-hidden">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1.5 text-slate-600">-</button>
                            <span className="px-3 min-w-8 text-center">{qty}</span>
                            <button onClick={() => setQty(q => q + 1)} className="px-3 py-1.5 text-slate-600">+</button>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onAddToCart}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-50"
                        >
                            <ShoppingBag size={16} /> Add to cart
                        </button>
                        <button
                            onClick={onOrderOnWhatsApp}
                            disabled={submitting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-white text-sm font-medium shadow-sm hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: brand }}
                        >
                            <MessageCircle size={16} /> Order on WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
