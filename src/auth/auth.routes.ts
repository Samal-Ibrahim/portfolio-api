import { Router } from "express";
import { login, logout, me } from "./auth.controller";

const router = Router();

router.post("/login", login);
router.get("/me", me);
router.post("/logout", logout);

export default router;
