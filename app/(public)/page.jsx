'use client'
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Store as StoreIcon, ArrowRight, Search } from "lucide-react"
import Loading from "@/components/Loading"
import axios from "axios"
import toast from "react-hot-toast"

export default function Home() {
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await axios.get('/api/stores')
                setStores(data.stores || [])
            } catch (error) {
                toast.error(error?.response?.data?.error || error.message)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const filtered = stores.filter(s => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    })

    return (
        <div className="mx-6">
            <section className="max-w-6xl mx-auto py-14 sm:py-20 text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                    <StoreIcon size={12} /> Multi-tenant marketplace
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-800">
                    Shop from independent stores.<br />
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Order on WhatsApp.</span>
                </h1>
                <p className="mt-4 text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
                    Every store is its own storefront. Browse, add to cart, then complete your order directly with the seller over WhatsApp. No online payments, no middlemen.
                </p>

                <div className="mt-7 max-w-md mx-auto">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-full focus-within:ring-2 ring-emerald-200">
                        <Search size={18} className="text-slate-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search stores"
                            className="w-full bg-transparent outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                    <span>Want to sell?</span>
                    <Link href="/create-store" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs hover:bg-slate-800">
                        Open your store <ArrowRight size={12} />
                    </Link>
                </div>
            </section>

            <section className="max-w-6xl mx-auto pb-20">
                <div className="flex items-end justify-between">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">All stores</h2>
                    <p className="text-sm text-slate-500">{filtered.length} live</p>
                </div>

                {loading ? (
                    <div className="mt-10"><Loading /></div>
                ) : filtered.length === 0 ? (
                    <div className="mt-10 text-slate-400 text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                        <p>No stores found.</p>
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(s => <StoreCard key={s.id} store={s} />)}
                    </div>
                )}
            </section>
        </div>
    )
}

function StoreCard({ store }) {
    const brand = store.brandColor || '#10b981'
    return (
        <Link href={`/${store.username}`} className="group block">
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:shadow-md transition">
                {store.banner ? (
                    <div className="h-28 overflow-hidden">
                        <Image src={store.banner} alt={store.name} width={400} height={120} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="h-28" style={{ background: `linear-gradient(135deg, ${brand}22, ${brand}44)` }} />
                )}
                <div className="p-5 flex items-start gap-3">
                    {store.logo ? (
                        <Image src={store.logo} alt={store.name} width={56} height={56} className="size-14 rounded-xl object-cover ring-1 ring-slate-200" />
                    ) : (
                        <div className="size-14 rounded-xl bg-slate-100" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-800 truncate" style={{ color: brand }}>{store.name}</p>
                        <p className="text-xs text-slate-400 -mt-0.5">@{store.username}</p>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{store.description}</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}
