'use client'
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Eye, EyeOff, Trash2, ExternalLink } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import Link from "next/link"

export default function AdminProducts() {
    const { getToken } = useAuth()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')

    const fetch = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
            setProducts(data.products || [])
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleHide = async (p) => {
        try {
            const token = await getToken()
            await axios.patch('/api/admin/product', { id: p.id, inStock: !p.inStock }, { headers: { Authorization: `Bearer ${token}` } })
            setProducts(prev => prev.map(x => x.id === p.id ? { ...x, inStock: !x.inStock } : x))
            toast.success(p.inStock ? 'Product hidden' : 'Product visible')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const onDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return
        try {
            const token = await getToken()
            await axios.delete('/api/admin/product', { data: { id } }, { headers: { Authorization: `Bearer ${token}` } })
            setProducts(prev => prev.filter(x => x.id !== id))
            toast.success('Deleted')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => { fetch() }, [])

    const filtered = products.filter(p => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.store?.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    })

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">All <span className="text-slate-800 font-medium">Products</span></h1>

            <div className="mt-4 mb-4 max-w-sm">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, stores, categories" className="w-full p-2 px-3 border border-slate-200 rounded text-sm" />
            </div>

            {loading ? <p>Loading…</p> : (
                <div className="overflow-x-auto max-w-6xl rounded-md border border-slate-200">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                            <tr>
                                {['Product', 'Store', 'Category', 'Price', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-slate-400 py-8">No products</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 min-w-0 max-w-xs">
                                            {p.images?.[0] && <Image src={p.images[0]} alt="" width={36} height={36} className="size-9 rounded object-cover" />}
                                            <span className="truncate">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.store?.username ? (
                                            <Link href={`/${p.store.username}`} className="text-emerald-600 hover:underline inline-flex items-center gap-1">
                                                {p.store.name} <ExternalLink size={12} />
                                            </Link>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{p.category}</td>
                                    <td className="px-4 py-3 font-medium">${p.price}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${p.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {p.inStock ? 'Visible' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => toggleHide(p)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded" title={p.inStock ? 'Hide' : 'Show'}>
                                                {p.inStock ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button onClick={() => onDelete(p.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
