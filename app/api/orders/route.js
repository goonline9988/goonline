import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { items, customerNote } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "missing order details." }, { status: 400 });
        }

        const ordersByStore = new Map();

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } });
            if (!product) {
                return NextResponse.json({ error: "product not found" }, { status: 404 });
            }
            const storeId = product.storeId;
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, []);
            }
            ordersByStore.get(storeId).push({
                ...item,
                price: product.price,
            });
        }

        const orderIds = [];

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            const total = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    total: parseFloat(total.toFixed(2)),
                    orderItems: {
                        create: sellerItems.map((item) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                            size: item.size || null,
                            color: item.color || null,
                        })),
                    },
                },
            });

            orderIds.push(order.id);
        }

        return NextResponse.json({
            message: "Order placed via WhatsApp",
            orderIds,
            customerNote: customerNote || null,
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ orders: [] });
        }
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                orderItems: { include: { product: true } },
                store: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
