'use client'
import { assets } from "@/assets/assets"
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { QrCode } from "lucide-react"
import Link from "next/link"

export default function StoreSettings() {

    const { getToken } = useAuth()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [store, setStore] = useState(null)
    const [logo, setLogo] = useState(null)
    const [banner, setBanner] = useState(null)
    const [form, setForm] = useState({
        name: '',
        username: '',
        description: '',
        email: '',
        contact: '',
        whatsapp: '',
        address: '',
        brandColor: '#10b981',
    })

    const fetchStore = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/is-seller', { headers: { Authorization: `Bearer ${token}` } })
            const s = data.storeInfo
            setStore(s)
            setForm({
                name: s.name || '',
                username: s.username || '',
                description: s.description || '',
                email: s.email || '',
                contact: s.contact || '',
                whatsapp: s.whatsapp || '',
                address: s.address || '',
                brandColor: s.brandColor || '#10b981',
            })
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const onSubmit = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            const token = await getToken()
            const formData = new FormData()
            Object.entries(form).forEach(([k, v]) => formData.append(k, v ?? ''))
            if (logo) formData.append('logo', logo)
            if (banner) formData.append('banner', banner)
            const { data } = await axios.patch('/api/store/settings', formData, {
                headers: { Authorization: `Bearer ${token}` },
            })
            toast.success(data.message)
            await fetchStore()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => { fetchStore() }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28 max-w-3xl">
            <h1 className="text-2xl">Store <span className="text-slate-800 font-medium">Settings</span></h1>
            <p className="text-sm text-slate-500 mt-1">Update your branding, contact details, and WhatsApp number. Your storefront is at <code className="px-1 bg-slate-100 rounded">/{store?.username}</code></p>

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Logo</p>
                        <label className="cursor-pointer inline-block">
                            <Image
                                src={logo ? URL.createObjectURL(logo) : (store?.logo || assets.upload_area)}
                                alt="logo"
                                width={120}
                                height={120}
                                className="h-24 w-24 object-cover rounded-xl border border-slate-200 bg-slate-50"
                            />
                            <input type="file" accept="image/*" hidden onChange={(e) => setLogo(e.target.files?.[0])} />
                        </label>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Banner (cover)</p>
                        <label className="cursor-pointer inline-block">
                            <div className="h-24 w-64 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-400 text-xs">
                                {banner ? (
                                    <Image src={URL.createObjectURL(banner)} alt="banner" width={256} height={96} className="object-cover w-full h-full" />
                                ) : store?.banner ? (
                                    <Image src={store.banner} alt="banner" width={256} height={96} className="object-cover w-full h-full" />
                                ) : (
                                    <span>Click to upload banner (1280×320)</span>
                                )}
                            </div>
                            <input type="file" accept="image/*" hidden onChange={(e) => setBanner(e.target.files?.[0])} />
                        </label>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Store name" name="name" value={form.name} onChange={onChange} required />
                    <Field label="Username (slug)" name="username" value={form.username} onChange={onChange} required />
                    <Field label="Email" name="email" value={form.email} onChange={onChange} type="email" required />
                    <Field label="Contact (general)" name="contact" value={form.contact} onChange={onChange} />
                    <Field label="WhatsApp number" name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="e.g. +1 555 123 4567" />
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Brand color</p>
                        <div className="flex items-center gap-3">
                            <input type="color" name="brandColor" value={form.brandColor} onChange={onChange} className="h-10 w-14 rounded border border-slate-200" />
                            <input type="text" name="brandColor" value={form.brandColor} onChange={onChange} className="flex-1 p-2 px-3 outline-none border border-slate-200 rounded font-mono text-sm" />
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
                    <textarea name="description" value={form.description} onChange={onChange} rows={4} className="w-full p-2 px-3 outline-none border border-slate-200 rounded resize-none" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Address</p>
                    <textarea name="address" value={form.address} onChange={onChange} rows={3} className="w-full p-2 px-3 outline-none border border-slate-200 rounded resize-none" />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button disabled={saving} className="bg-slate-900 text-white px-6 py-2.5 rounded hover:bg-slate-800 active:scale-95 transition disabled:opacity-60">
                        {saving ? 'Saving…' : 'Save settings'}
                    </button>
                    {store?.username && (
                        <Link href={`/store/qr`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm">
                            <QrCode size={16} /> View QR code
                        </Link>
                    )}
                </div>
            </form>
        </div>
    )
}

function Field({ label, ...rest }) {
    return (
        <div>
            <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
            <input {...rest} className="w-full p-2 px-3 outline-none border border-slate-200 rounded" />
        </div>
    )
}
