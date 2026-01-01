import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import authRoutes from "./auth/auth.routes";
import { prisma } from "./db";
import { ValidationError } from "./errors/AppError";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";
import { logger } from "./logger";
import adminProjectsRoutes from "./projects/projects.routes";
import { asyncHandler } from "./utils/asyncHandler";

const app = express();

app.use(pinoHttp({ logger }));

/* security & parsers */
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

/* CORS*/
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 200,
	}),
);

app.get("/", (_req, res) => {
	res.json({ message: "Welcome to my Portfolio API" });
});

/* health */
app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

/* public */
app.get(
	"/projects",
	asyncHandler(async (req, res) => {
		try {
			// Parse query parameters for pagination
			const page = Number.parseInt(req.query.page as string, 10) || 1;
			const limit = Number.parseInt(req.query.limit as string, 10) || 10;
			const skip = (page - 1) * limit;

			logger.info({ page, limit, skip }, "Fetching projects");

			// Get total count for pagination
			const totalCount = await prisma.project.count();
			logger.info({ totalCount }, "Total count fetched");

			// Fetch projects with pagination
			const projects = await prisma.project.findMany({
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
		} catch (error) {
			logger.error(error, "Error in GET /projects");
			throw error;
		}
	}),
);

app.post(
	"/projects",
	asyncHandler(async (req, res) => {
		const { title, description, imageUrl, githubUrl, liveUrl, tags } = req.body;

		if (!title) {
			throw new ValidationError("title is required");
		}

		const created = await prisma.project.create({
			data: {
				title,
				description,
				imageUrl,
				githubUrl,
				liveUrl,
				tech: tags || [],
			},
		});

		res.status(201).json(created);
	}),
);

/* auth + admin */
app.use("/auth", authRoutes);
app.use("/admin/projects", adminProjectsRoutes);

/* error handlers - must be last */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
