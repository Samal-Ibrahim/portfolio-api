import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ValidationError } from "../errors/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const login = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		throw new ValidationError("Email and password are required");
	}

	if (email !== process.env.ADMIN_EMAIL) {
		throw new UnauthorizedError("Invalid credentials");
	}

	const adminPassword = process.env.ADMIN_PASSWORD;
	if (!adminPassword) {
		throw new Error("Server configuration error: ADMIN_PASSWORD not set");
	}

	const valid = await bcrypt.compare(password, adminPassword || "");

	if (!valid) {
		throw new UnauthorizedError("Invalid credentials");
	}

	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error("Server configuration error: JWT_SECRET not set");
	}

	const token = jwt.sign({ role: "admin" }, jwtSecret, {
		expiresIn: "1d",
	});

	res.cookie("token", token, {
		httpOnly: true,
		sameSite: "lax",
		secure: false,
	});

	res.json({ token: token });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
	const token = req.cookies.token;

	if (!token) {
		throw new UnauthorizedError();
	}

	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("Server configuration error: JWT_SECRET not set");
	}

	jwt.verify(token, secret);
	res.json({ ok: true, role: "admin" });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
	res.clearCookie("token");
	res.json({ ok: true });
});
