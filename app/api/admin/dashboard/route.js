import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const orders = await prisma.order.count()
        const stores = await prisma.store.count()
        const products = await prisma.product.count()
        const allOrders = await prisma.order.findMany({
            select: { createdAt: true, total: true, storeId: true },
        })

        let totalRevenue = 0
        allOrders.forEach(o => { totalRevenue += o.total })
        const revenue = totalRevenue.toFixed(2)

        // projected commission (display-only, no payment)
        const storesWithCommission = await prisma.store.findMany({ select: { id: true, commissionPercent: true } })
        const commissionMap = new Map(storesWithCommission.map(s => [s.id, s.commissionPercent || 0]))
        let projectedCommission = 0
        allOrders.forEach(o => {
            const pct = (o.storeId && commissionMap.get(o.storeId)) || 0
            projectedCommission += o.total * (pct / 100)
        })

        const dashboardData = {
            orders,
            stores,
            products,
            revenue,
            projectedCommission: projectedCommission.toFixed(2),
            allOrders,
        }
        return NextResponse.json({ dashboardData })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}