'use client'
import { PackageIcon, Search, ShoppingCart, StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton, Protect } from "@clerk/nextjs"

const Navbar = () => {

    const { user } = useUser()
    const { openSignIn } = useClerk()
    const router = useRouter();

    const [search, setSearch] = useState('')

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${encodeURIComponent(search)}`)
    }

    return (
        <nav className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">

                    <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                        <span className="text-emerald-600">go</span>cart<span className="text-emerald-600 text-5xl leading-0">.</span>
                        <Protect plan='plus'>
                            <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-emerald-500">
                                plus
                            </p>
                        </Protect>
                    </Link>

                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/" className="hover:text-slate-900 transition">Stores</Link>
                        <Link href="/create-store" className="hover:text-slate-900 transition flex items-center gap-1.5"><StoreIcon size={16} /> Sell on GoCart</Link>
                        <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full focus-within:ring-2 ring-emerald-200">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-500" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </form>

                        {
                            !user ? (
                                <button onClick={openSignIn} className="px-7 py-2 bg-slate-900 hover:bg-slate-800 transition text-white rounded-full text-sm">
                                    Login
                                </button>
                            ) : (
                                <UserButton>
                                    <UserButton.MenuItems>
                                        <UserButton.Action labelIcon={<StoreIcon size={16} />} label="My Stores" onClick={() => router.push('/store')} />
                                    </UserButton.MenuItems>
                                </UserButton>
                            )
                        }
                    </div>

                    <div className="sm:hidden">
                        {user ? (
                            <UserButton>
                                <UserButton.MenuItems>
                                    <UserButton.Action labelIcon={<StoreIcon size={16} />} label="My Stores" onClick={() => router.push('/store')} />
                                </UserButton.MenuItems>
                            </UserButton>
                        ) : (
                            <button onClick={openSignIn} className="px-6 py-1.5 bg-slate-900 text-sm transition text-white rounded-full">
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
