'use client'
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import toast from "react-hot-toast"
import PublicStoreNavbar from "@/components/store/PublicStoreNavbar"
import Loading from "@/components/Loading"
import OrderSummary from "@/components/OrderSummary"
import Link from "next/link"

export default function PublicStoreCart() {
    const { username } = useParams()
    const [store, setStore] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await axios.get(`/api/store/data?username=${username}`)
                setStore(data.store)
            } catch (error) {
                toast.error(error?.response?.data?.error || 'Store not found')
            } finally {
                setLoading(false)
            }
        }
        if (username) fetch()
    }, [username])

    if (loading) return <Loading />
    if (!store) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
                <p className="text-2xl">Store not found</p>
            </div>
        )
    }

    return (
        <div>
            <PublicStoreNavbar store={store} search="" onSearch={() => {}} />
            <div className="mx-6 max-w-6xl mt-6">
                <Link href={`/${store.username}`} className="text-sm text-slate-500 hover:text-slate-700">← Continue shopping at {store.name}</Link>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-3">Your cart at {store.name}</h1>
            </div>
            <div className="mx-6 max-w-6xl mt-6">
                <OrderSummary store={store} />
            </div>
        </div>
    )
}
