import { prisma } from "../src/db";

async function main() {
	await prisma.project.createMany({
		data: [
			{
				title: "Portfolio API",
				description:
					"Express + Prisma + Postgres backend powering my portfolio cards.",
				tech: ["Express", "Prisma", "PostgreSQL", "TypeScript"],
				imageUrl: "https://placehold.co/1200x630/png",
				liveUrl: "https://your-live-site.com",
				githubUrl: "https://github.com/FransoArbela/portfolio-api",
				sortOrder: 1,
			},
		],
		skipDuplicates: true,
	});
}



main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
