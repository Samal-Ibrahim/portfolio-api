import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import authRoutes from "./auth/auth.routes";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";
import { logger } from "./logger";
import adminProjectsRoutes from "./projects/auth/projects.routes";
import publicProjectsRoutes from "./projects/public/projects.routes";

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

/* auth + admin */
app.use("/auth", authRoutes);
app.use("/admin/projects", adminProjectsRoutes);
app.use("/projects", publicProjectsRoutes); // Public projects route

/* error handlers - must be last */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
