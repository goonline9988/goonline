import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const stores = await prisma.store.findMany({
            where: { status: 'approved', isActive: true },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                username: true,
                description: true,
                logo: true,
                banner: true,
                brandColor: true,
            }
        })
        return NextResponse.json({ stores })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
