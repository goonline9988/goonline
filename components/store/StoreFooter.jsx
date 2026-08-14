'use client'
import Link from "next/link"
import { QrCode } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { useEffect, useRef, useState } from "react"

export default function StoreFooter({ store }) {
    const brand = store.brandColor || '#10b981'
    const [url, setUrl] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setUrl(`${window.location.origin}/${store.username}`)
        }
    }, [store.username])

    return (
        <footer className="mt-20 border-t border-slate-200 bg-white">
            <div className="mx-6">
                <div className="max-w-7xl mx-auto py-10 grid sm:grid-cols-3 gap-8 text-sm text-slate-600">
                    <div>
                        <p className="text-lg font-semibold" style={{ color: brand }}>{store.name}</p>
                        <p className="mt-2 text-slate-500 max-w-xs">{store.description}</p>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                        <p className="text-slate-600 font-medium mb-2">Visit</p>
                        <p>Storefront: <Link href={`/${store.username}`} className="text-slate-700 hover:underline">/{store.username}</Link></p>
                        <p>Cart: <Link href={`/${store.username}/cart`} className="text-slate-700 hover:underline">/{store.username}/cart</Link></p>
                        {store.email && <p>Email: <a href={`mailto:${store.email}`} className="text-slate-700 hover:underline">{store.email}</a></p>}
                    </div>
                    {url && (
                        <div className="flex flex-col items-start sm:items-end">
                            <p className="text-slate-600 font-medium mb-2 flex items-center gap-2"><QrCode size={14} /> Share this store</p>
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                                <QRCodeCanvas value={url} size={92} bgColor="#ffffff" fgColor={brand} includeMargin={false} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Scan to open the store</p>
                        </div>
                    )}
                </div>
            </div>
        </footer>
    )
}
