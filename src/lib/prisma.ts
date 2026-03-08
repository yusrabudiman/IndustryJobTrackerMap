import { PrismaClient } from '../../generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined
}

function createPrismaClient() {
    const url = process.env.DATABASE_URL
    if (!url) {
        throw new Error('DATABASE_URL is not defined in environment variables')
    }
    return new PrismaClient({
        accelerateUrl: url
    }).$extends(withAccelerate())
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}