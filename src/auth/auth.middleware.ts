import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/AppError";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
	const token = req.cookies.token;


	if (!token) {
		throw new UnauthorizedError();
	}

	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("Server configuration error: JWT_SECRET not set");
	}

	try {
		jwt.verify(token, secret);
		next();
	} catch (_error) {
		throw new UnauthorizedError();
	}
}
