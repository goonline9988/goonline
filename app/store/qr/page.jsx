'use client'
import { useEffect, useRef, useState } from "react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"
import { Download } from "lucide-react"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"

export default function StoreQRPage() {
    const { getToken } = useAuth()
    const [store, setStore] = useState(null)
    const [loading, setLoading] = useState(true)
    const [url, setUrl] = useState('')
    const [size, setSize] = useState(256)
    const [fg, setFg] = useState('#0f172a')
    const canvasRef = useRef(null)

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/store/is-seller', { headers: { Authorization: `Bearer ${token}` } })
                setStore(data.storeInfo)
                if (typeof window !== 'undefined') {
                    setUrl(`${window.location.origin}/${data.storeInfo.username}`)
                }
                if (data.storeInfo.brandColor) setFg(data.storeInfo.brandColor)
            } catch (error) {
                toast.error(error?.response?.data?.error || error.message)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [getToken])

    const downloadPng = () => {
        const canvas = document.getElementById('store-qr-canvas')
        if (!canvas) return
        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `${store.username}-qr.png`
        link.click()
    }

    const downloadSvg = () => {
        const svg = document.getElementById('store-qr-svg')
        if (!svg) return
        const serializer = new XMLSerializer()
        let source = serializer.serializeToString(svg)
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
        }
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${store.username}-qr.svg`
        link.click()
        URL.revokeObjectURL(url)
    }

    if (loading) return <Loading />
    if (!store) return <p>No store</p>

    return (
        <div className="text-slate-500 mb-28 max-w-3xl">
            <h1 className="text-2xl">Store <span className="text-slate-800 font-medium">QR Code</span></h1>
            <p className="text-sm text-slate-500 mt-1">Share this QR so customers can scan to open <span className="font-medium">/{store.username}</span>.</p>

            <div className="mt-8 grid sm:grid-cols-[auto,1fr] gap-8 items-start">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <QRCodeCanvas
                        id="store-qr-canvas"
                        ref={canvasRef}
                        value={url}
                        size={size}
                        bgColor="#ffffff"
                        fgColor={fg}
                        includeMargin
                        level="M"
                    />
                    <div className="hidden">
                        <QRCodeSVG
                            id="store-qr-svg"
                            value={url}
                            size={size}
                            bgColor="#ffffff"
                            fgColor={fg}
                            level="M"
                        />
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">URL</p>
                        <input value={url} readOnly className="w-full p-2 px-3 outline-none border border-slate-200 rounded font-mono text-sm bg-slate-50" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Size: {size}px</p>
                            <input type="range" min={128} max={512} step={16} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Foreground</p>
                            <div className="flex items-center gap-2">
                                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-14 rounded border border-slate-200" />
                                <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} className="flex-1 p-2 px-3 outline-none border border-slate-200 rounded font-mono text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button onClick={downloadPng} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800">
                            <Download size={16} /> Download PNG
                        </button>
                        <button onClick={downloadSvg} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">
                            <Download size={16} /> Download SVG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
