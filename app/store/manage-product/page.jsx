'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { Pencil, Trash2, X } from "lucide-react"

export default function StoreManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [editing, setEditing] = useState(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(null)

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/product', { headers: { Authorization: `Bearer ${token}` } })
            setProducts(data.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/categories')
            setCategories(data.categories || [])
        } catch (e) { }
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/stock-toggle', { productId }, { headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product => product.id === productId ? { ...product, inStock: !product.inStock } : product))
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const onDelete = async (productId) => {
        if (!window.confirm('Delete this product? This cannot be undone.')) return
        try {
            setDeleting(productId)
            const token = await getToken()
            await axios.delete('/api/store/product', { data: { id: productId } }, { headers: { Authorization: `Bearer ${token}` } })
            setProducts(prev => prev.filter(p => p.id !== productId))
            toast.success('Product deleted')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setDeleting(null)
        }
    }

    const onSaveEdit = async (e) => {
        e?.preventDefault?.()
        if (!editing) return
        try {
            setSaving(true)
            const token = await getToken()
            const formData = new FormData()
            formData.append('id', editing.id)
            formData.append('name', editing.name)
            formData.append('description', editing.description)
            formData.append('mrp', editing.mrp)
            formData.append('price', editing.price)
            formData.append('category', editing.category)
            formData.append('sizes', (editing.sizes || []).join(','))
            formData.append('colors', (editing.colors || []).join(','))
            formData.append('inStock', String(!!editing.inStock))
            formData.append('replaceImages', 'true')
            for (const file of editing.newImages || []) {
                formData.append('images', file)
            }
            const { data } = await axios.patch('/api/store/product', formData, { headers: { Authorization: `Bearer ${token}` } })
            toast.success(data.message)
            setEditing(null)
            await fetchProducts()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchProducts()
            fetchCategories()
        }
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            {products.length === 0 ? (
                <p className="text-slate-400">No products yet.</p>
            ) : (
                <table className="w-full max-w-5xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden md:table-cell">Category</th>
                            <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">In stock</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {products.map((product) => (
                            <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center min-w-0">
                                        <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images?.[0]} alt="" />
                                        <span className="truncate max-w-[200px]">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-slate-600">{product.category}</td>
                                <td className="px-4 py-3 hidden md:table-cell">{currency} {Number(product.mrp).toLocaleString()}</td>
                                <td className="px-4 py-3">{currency} {Number(product.price).toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating data..." })} checked={product.inStock} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setEditing({
                                                ...product,
                                                sizes: product.sizes || [],
                                                colors: product.colors || [],
                                                newImages: [],
                                            })}
                                            className="p-2 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(product.id)}
                                            disabled={deleting === product.id}
                                            className="p-2 rounded text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {editing && (
                <div onClick={() => setEditing(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onClick={e => e.stopPropagation()} onSubmit={onSaveEdit} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-800">Edit product</h2>
                            <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </div>

                        <Field label="Name">
                            <input className="w-full p-2 px-3 outline-none border border-slate-200 rounded" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
                        </Field>
                        <Field label="Description">
                            <textarea className="w-full p-2 px-3 outline-none border border-slate-200 rounded resize-none" rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} required />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="MRP">
                                <input type="number" className="w-full p-2 px-3 outline-none border border-slate-200 rounded" value={editing.mrp} onChange={(e) => setEditing({ ...editing, mrp: Number(e.target.value) })} required />
                            </Field>
                            <Field label="Price">
                                <input type="number" className="w-full p-2 px-3 outline-none border border-slate-200 rounded" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} required />
                            </Field>
                        </div>
                        <Field label="Category">
                            <select className="w-full p-2 px-3 outline-none border border-slate-200 rounded" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                                <option value="">Select…</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Sizes (comma-separated)">
                            <input className="w-full p-2 px-3 outline-none border border-slate-200 rounded" value={(editing.sizes || []).join(', ')} onChange={(e) => setEditing({ ...editing, sizes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                        </Field>
                        <Field label="Colors (comma-separated)">
                            <input className="w-full p-2 px-3 outline-none border border-slate-200 rounded" value={(editing.colors || []).join(', ')} onChange={(e) => setEditing({ ...editing, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                        </Field>
                        <Field label="Replace images (optional)">
                            <input type="file" accept="image/*" multiple onChange={(e) => setEditing({ ...editing, newImages: Array.from(e.target.files || []) })} className="w-full text-sm" />
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={!!editing.inStock} onChange={(e) => setEditing({ ...editing, inStock: e.target.checked })} />
                            In stock
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100">Cancel</button>
                            <button disabled={saving} className="px-5 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60">
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

function Field({ label, children }) {
    return (
        <div>
            <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
            {children}
        </div>
    )
}
