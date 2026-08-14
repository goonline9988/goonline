'use client'
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, MessageCircle, StarIcon } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import PublicStoreNavbar from "@/components/store/PublicStoreNavbar"
import Loading from "@/components/Loading"
import { buildWaLink } from "@/lib/whatsapp"

export default function PublicStorePage() {
    const { username } = useParams()
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const { data } = await axios.get(`/api/store/data?username=${username}`)
                setStore(data.store)
                setProducts((data.store.Product || []).filter(p => p.inStock))
            } catch (error) {
                toast.error(error?.response?.data?.error || 'Store not found')
            } finally {
                setLoading(false)
            }
        }
        if (username) fetchStore()
    }, [username])

    const visibleProducts = useMemo(() => {
        if (!search.trim()) return products
        const q = search.toLowerCase()
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
        )
    }, [products, search])

    if (loading) return <Loading />
    if (!store) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
                <p className="text-2xl">Store not found</p>
            </div>
        )
    }

    const brand = store.brandColor || '#10b981'

    return (
        <div>
            <PublicStoreNavbar store={store} search={search} onSearch={setSearch} />

            {/* Banner / hero */}
            <section className="relative">
                {store.banner ? (
                    <div className="h-44 sm:h-64 w-full overflow-hidden">
                        <Image src={store.banner} alt={store.name} width={1600} height={400} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="h-32 sm:h-44 w-full" style={{ background: `linear-gradient(135deg, ${brand}1a, ${brand}33)` }} />
                )}

                <div className="mx-6 -mt-12 sm:-mt-16 max-w-5xl">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 sm:p-7 flex flex-col sm:flex-row items-start gap-5">
                        {store.logo && (
                            <Image src={store.logo} alt={store.name} width={96} height={96} className="size-20 sm:size-24 rounded-2xl object-cover ring-1 ring-slate-200" />
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800" style={{ color: brand }}>{store.name}</h1>
                            <p className="text-sm text-slate-500 mt-1">@{store.username}</p>
                            <p className="text-sm text-slate-600 mt-3 max-w-2xl">{store.description}</p>
                        </div>
                        {store.whatsapp && (
                            <a
                                href={buildWaLink(store.whatsapp, `Hi ${store.name}, I'd like to know more about your products.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-sm hover:opacity-90 transition"
                                style={{ backgroundColor: brand }}
                            >
                                <MessageCircle size={16} /> Chat on WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Search on mobile */}
            <div className="mx-6 mt-6 md:hidden">
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-full">
                    <Search size={18} className="text-slate-600" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm"
                        placeholder={`Search ${store.name}`}
                    />
                </div>
            </div>

            {/* Products */}
            <section className="mx-6 mt-8 max-w-7xl self-stretch">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Products</h2>
                    <p className="text-sm text-slate-500">{visibleProducts.length} item{visibleProducts.length === 1 ? '' : 's'}</p>
                </div>

                {visibleProducts.length === 0 ? (
                    <div className="mt-12 text-center text-slate-400 py-20">
                        <p className="text-2xl">No products match your search.</p>
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {visibleProducts.map(p => <StorefrontProductCard key={p.id} product={p} store={store} />)}
                    </div>
                )}
            </section>
        </div>
    )
}

function StorefrontProductCard({ product, store }) {
    const brand = store.brandColor || '#10b981'
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    const rating = product.rating?.length
        ? product.rating.reduce((a, b) => a + (b.rating || 0), 0) / product.rating.length
        : 0

    return (
        <Link href={`/${store.username}/product/${product.id}`} className="group block">
            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                {product.images?.[0] && (
                    <Image src={product.images[0]} alt={product.name} width={400} height={400} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                )}
            </div>
            <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    {product.rating?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <StarIcon size={12} className="text-transparent" fill={brand} />
                            <span>{rating.toFixed(1)}</span>
                            <span className="text-slate-400">({product.rating.length})</span>
                        </div>
                    )}
                </div>
                <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{currency}{product.price}</p>
            </div>
        </Link>
    )
}
