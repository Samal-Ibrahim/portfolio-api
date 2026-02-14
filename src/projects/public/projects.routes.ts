import { Router } from "express";
import { prisma } from "../../db";
import { ValidationError } from "../../errors/AppError";
import { logger } from "../../logger";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();


router.get(
	"/",
	asyncHandler(async (req, res, next) => {
		try {
			// Parse query parameters for pagination
			const page = Number.parseInt(req.query.page as string, 10) || 1;
			const limit = Number.parseInt(req.query.limit as string, 10) || 10;
			const skip = (page - 1) * limit;

			logger.info({ page, limit, skip }, "Fetching projects");

			// Get total count for pagination
			const totalCount = await prisma.projects.count();
			logger.info({ totalCount }, "Total count fetched");

			// Fetch projects with pagination
			const projects = await prisma.projects.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			});
			logger.info({ projectsCount: projects.length }, "Projects fetched");

			// Structure the response
			res.json({
				success: true,
				data: projects.map((project) => ({
					id: project.id,
					title: project.title,
					description: project.description,
					technologies: {
						tech: project.tech,
					},
					images: {
						thumbnail: project.imageUrl,
					},
					links: {
						live: project.liveUrl,
						github: project.githubUrl,
					},
					metadata: {
						createdAt: project.createdAt,
					},
					isPublished: true,
				})),
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(totalCount / limit),
					totalCount,
					perPage: limit,
					hasNextPage: page < Math.ceil(totalCount / limit),
					hasPreviousPage: page > 1,
				},
			});
		} catch (error) {
			logger.error(error, "Error in GET /projects");
			if (res.headersSent) return next(error);

			throw error;
		}
	}),
);

router.get(
	"/:id",
	asyncHandler(async (req, res, _next) => {
		const { id } = req.params;

		const project = await prisma.projects.findUnique({
			where: { id },
		});

		if (!project) {
			throw new ValidationError("Project not found");
		}

		res.json({
			id: project.id,
			title: project.title,
			description: project.description,
			technologies: {
				tech: project.tech,
			},
			images: {
				thumbnail: project.imageUrl,
			},
			links: {
				live: project.liveUrl,
				github: project.githubUrl,
			},
			metadata: {
				createdAt: project.createdAt,
			},
			isPublished: true,
		});
	}),
);

export default router;
