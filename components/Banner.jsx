'use client'
import React from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

export default function Banner() {

    const [isOpen, setIsOpen] = React.useState(true);

    return isOpen && (
        <div className="w-full px-6 py-1.5 font-medium text-sm text-white text-center bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
            <div className='flex items-center justify-between max-w-7xl mx-auto'>
                <p>
                    Discover independent stores &mdash; order directly on WhatsApp.{' '}
                    <Link href="/create-store" className="underline underline-offset-2 hover:text-emerald-50 font-semibold">Open your own store</Link>
                </p>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setIsOpen(false)} type="button" className="font-normal text-white/90 py-2 rounded-full hover:text-white" aria-label="Dismiss">
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
