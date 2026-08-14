'use client'
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Trash2, Pencil, Plus, X } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

export default function AdminCategories() {
    const { getToken } = useAuth()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [editing, setEditing] = useState(null)
    const [newCat, setNewCat] = useState({ name: '', image: '' })

    const fetch = async () => {
        try {
            const { data } = await axios.get('/api/admin/category')
            setCategories(data.categories || [])
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    const onCreate = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            await axios.post('/api/admin/category', newCat, { headers: { Authorization: `Bearer ${token}` } })
            toast.success('Category created')
            setNewCat({ name: '', image: '' })
            setCreating(false)
            await fetch()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const onSave = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            await axios.patch('/api/admin/category', editing, { headers: { Authorization: `Bearer ${token}` } })
            toast.success('Category updated')
            setEditing(null)
            await fetch()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const onDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return
        try {
            const token = await getToken()
            await axios.delete(`/api/admin/category?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
            toast.success('Category deleted')
            await fetch()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => { fetch() }, [])

    if (loading) return <p className="text-slate-400">Loading…</p>

    return (
        <div className="text-slate-500 mb-28">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Product <span className="text-slate-800 font-medium">Categories</span></h1>
                <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm hover:bg-slate-800">
                    <Plus size={14} /> New
                </button>
            </div>

            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 max-w-3xl">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold">Name</th>
                            <th className="text-left px-4 py-3 font-semibold">Slug</th>
                            <th className="text-left px-4 py-3 font-semibold">Products</th>
                            <th className="text-left px-4 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.length === 0 ? (
                            <tr><td colSpan={4} className="text-center text-slate-400 py-8">No categories yet</td></tr>
                        ) : categories.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{c.slug}</td>
                                <td className="px-4 py-3 text-slate-600">{c._count?.products ?? 0}</td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button onClick={() => setEditing({ id: c.id, name: c.name, image: c.image || '' })} className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded"><Pencil size={14} /></button>
                                    <button onClick={() => onDelete(c.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {creating && (
                <Modal onClose={() => setCreating(false)} title="New category">
                    <form onSubmit={onCreate} className="space-y-3">
                        <input className="w-full p-2 px-3 border border-slate-200 rounded" placeholder="Name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} required />
                        <input className="w-full p-2 px-3 border border-slate-200 rounded" placeholder="Image URL (optional)" value={newCat.image} onChange={(e) => setNewCat({ ...newCat, image: e.target.value })} />
                        <ModalActions onClose={() => setCreating(false)} />
                    </form>
                </Modal>
            )}

            {editing && (
                <Modal onClose={() => setEditing(null)} title="Edit category">
                    <form onSubmit={onSave} className="space-y-3">
                        <input className="w-full p-2 px-3 border border-slate-200 rounded" placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
                        <input className="w-full p-2 px-3 border border-slate-200 rounded" placeholder="Image URL (optional)" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
                        <ModalActions onClose={() => setEditing(null)} />
                    </form>
                </Modal>
            )}
        </div>
    )
}

function Modal({ children, onClose, title }) {
    return (
        <div onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    )
}

function ModalActions({ onClose }) {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 text-sm">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800">Save</button>
        </div>
    )
}
