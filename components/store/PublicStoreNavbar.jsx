'use client'
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Search, ShoppingBag, User2, X, Menu } from "lucide-react"
import { useUser, useClerk, UserButton } from "@clerk/nextjs"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { buildWaLink } from "@/lib/whatsapp"

export default function StoreNavbar({ store, search, onSearch }) {
    const { user } = useUser()
    const { openSignIn } = useClerk()
    const router = useRouter()

    const cartItems = useSelector(s => s.cart.cartByStore?.[store.id]?.items) || []
    const cartCount = cartItems.reduce((acc, it) => acc + (it.qty || 0), 0)

    const brand = store.brandColor || '#10b981'

    const onSubmit = (e) => {
        e.preventDefault()
        onSearch?.(search)
    }

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-30">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-3">
                    <Link href={`/${store.username}`} className="flex items-center gap-3 min-w-0">
                        {store.logo ? (
                            <Image src={store.logo} alt={store.name} width={44} height={44} className="rounded-full size-11 object-cover ring-1 ring-slate-200" />
                        ) : (
                            <div className="size-11 rounded-full bg-slate-100" />
                        )}
                        <div className="min-w-0">
                            <p className="text-lg font-semibold text-slate-800 truncate" style={{ color: brand }}>{store.name}</p>
                            <p className="text-xs text-slate-400 -mt-0.5">/{store.username}</p>
                        </div>
                    </Link>

                    <form onSubmit={onSubmit} className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-full w-80 focus-within:ring-2" style={{ '--tw-ring-color': brand }}>
                        <Search size={18} className="text-slate-600" />
                        <input
                            className="w-full bg-transparent outline-none text-sm placeholder-slate-500"
                            type="text"
                            placeholder={`Search ${store.name}`}
                            value={search}
                            onChange={(e) => onSearch?.(e.target.value)}
                        />
                    </form>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${store.username}/cart`}
                            className="relative inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm"
                        >
                            <ShoppingBag size={18} />
                            <span className="hidden sm:inline">Cart</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-2 text-[10px] text-white size-4 rounded-full flex items-center justify-center" style={{ backgroundColor: brand }}>
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {store.whatsapp && (
                            <a
                                href={buildWaLink(store.whatsapp, `Hi ${store.name}, I'd like to know more about your products.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-sm hover:opacity-90 transition"
                                style={{ backgroundColor: brand }}
                            >
                                <MessageCircle size={16} /> Chat
                            </a>
                        )}

                        {user ? (
                            <UserButton afterSignOutUrl={`/${store.username}`} />
                        ) : (
                            <button onClick={openSignIn} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                                <User2 size={16} /> Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
