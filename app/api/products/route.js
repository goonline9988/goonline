import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");

        const where = { inStock: true };
        if (storeId) where.storeId = storeId;

        let products = await prisma.product.findMany({
            where,
            include: {
                rating: {
                    select: {
                        createdAt: true,
                        rating: true,
                        review: true,
                        user: { select: { name: true, image: true } },
                    },
                },
                store: true,
            },
            orderBy: { createdAt: "desc" },
        });

        products = products.filter((product) => product.store && product.store.isActive);

        return NextResponse.json({ products });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}
