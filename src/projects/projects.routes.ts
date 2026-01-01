import { Router } from "express";
import { requireAdmin } from "../auth/auth.middleware";
import { prisma } from "../db";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Get ALL projects (including drafts)
router.get(
	"/",
	requireAdmin,
	asyncHandler(async (req, res) => {
		// Parse query parameters for pagination and filtering
		const page = Number.parseInt(req.query.page as string, 10) || 1;
		const limit = Number.parseInt(req.query.limit as string, 10) || 10;
		const skip = (page - 1) * limit;

		// Get total count for pagination metadata
		const totalCount = await prisma.project.count();

		// Fetch projects with pagination
		const projects = await prisma.project.findMany({
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		});

		// Structure the response
		res.json({
			success: true,
			data: projects.map((project) => ({
				id: project.id,
				title: project.title,
				description: project.description,
				technologies: project.tech,
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
	}),
);

// Create
router.post(
	"/",
	requireAdmin,
	asyncHandler(async (req, res) => {
		if (!req.body.title) {
			throw new ValidationError("Title is required");
		}

		const created = await prisma.project.create({
			data: req.body,
		});
		res.status(201).json(created);
	}),
);

// Update
router.put(
	"/:id",
	requireAdmin,
	asyncHandler(async (req, res) => {
		const project = await prisma.project.findUnique({
			where: { id: req.params.id },
		});

		if (!project) {
			throw new NotFoundError("Project not found");
		}

		const updated = await prisma.project.update({
			where: { id: req.params.id },
			data: req.body,
		});
		res.json(updated);
	}),
);

// Delete
router.delete(
	"/:id",
	requireAdmin,
	asyncHandler(async (req, res) => {
		const project = await prisma.project.findUnique({
			where: { id: req.params.id },
		});

		if (!project) {
			throw new NotFoundError("Project not found");
		}

		await prisma.project.delete({ where: { id: req.params.id } });
		res.status(204).send();
	}),
);

export default router;
