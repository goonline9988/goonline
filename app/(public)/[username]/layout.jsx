import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import StoreFooter from "@/components/store/StoreFooter"

export const dynamic = 'force-dynamic'

export default async function StoreLayout({ children, params }) {
    const { username } = await params

    if (!username) notFound()

    const store = await prisma.store.findUnique({
        where: { username: String(username).toLowerCase() },
    })

    if (!store || !store.isActive) notFound()

    return (
        <div className="min-h-screen flex flex-col" style={{ '--brand': store.brandColor || '#10b981' }}>
            {children}
            <StoreFooter store={store} />
        </div>
    )
}
