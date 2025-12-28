import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import authRoutes from "./auth/auth.routes";
import { prisma } from "./db";
import { logger } from "./logger";
import adminProjectsRoutes from "./projects/projects.routes";

const app = express();

app.use(pinoHttp({ logger }));

/* security & parsers */
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

/* ✅ CORS MUST BE HERE */
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

// app.options("/*", cors());

/* rate limiting */
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 200,
	}),
);

/* health */
app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

/* public */
app.get("/projects", async (_req, res) => {
	const projects = await prisma.project.findMany({
		where: { isPublished: true },
		orderBy: { sortOrder: "asc" },
	});
	res.json({ route: "works" });
	res.json(projects);
});

/* auth + admin */
app.use("/auth", authRoutes);
app.use("/admin/projects", adminProjectsRoutes);

export default app;
