const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();
async function main() {
    console.log("querying...");
    const comments = await prisma.comment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } }
    });
    console.log(JSON.stringify(comments, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
