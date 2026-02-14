import { Router } from "express";
import { requireAdmin } from "../../auth/auth.middleware";
import { prisma } from "../../db";
import { NotFoundError, ValidationError } from "../../errors/AppError";
import { logger } from "../../logger";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// Get ALL projects (including drafts)
router.get(
	"/d",
	requireAdmin,
	asyncHandler(async (req, res) => {
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

					tech: project.tech,

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
			throw error;
		}
	}),
);

// Create
router.post(
	"/",
	requireAdmin,
	asyncHandler(async (req, res) => {
		const { title, description, imageUrl, githubUrl, liveUrl, tech } = req.body;
		if (!req.body.title) {
			throw new ValidationError("Title is required");
		}
		const created = await prisma.projects.create({
			data: {
				title,
				description,
				imageUrl,
				githubUrl,
				liveUrl,
				tech: {
					set: tech || [],
				},
				isPublished: true,
			},
		});
		res.status(201).json(created);
	}),
);

// Update
router.put(
	"/:id",
	requireAdmin,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { title, description, imageUrl, githubUrl, liveUrl, tech } = req.body;

		const project = await prisma.projects.findUnique({
			where: { id },
		});

		if (!project) {
			throw new ValidationError("Project not found");
		}

		const successMessage = `Project with ID ${id} updated successfully!`;
		logger.info({ projectId: id }, successMessage);

		const updated = await prisma.projects.update({
			where: { id },
			data: {
				title,
				description,
				imageUrl,
				githubUrl,
				liveUrl,
				tech: {
					set: tech || [],
				},
				isPublished: true,
			},
		});

		res.json({ success: true, message: successMessage, data: updated });
	}),
);

// Delete
router.delete(
	"/:id",
	requireAdmin,
	asyncHandler(async (req, res) => {
		const project = await prisma.projects.findUnique({
			where: { id: req.params.id },
		});

		if (!project) {
			throw new NotFoundError("Project not found");
		}

		await prisma.projects.delete({ where: { id: req.params.id } });
		res.status(204).send();
	}),
);

export default router;
