import express from "express";
import { genericUpdate } from "../controllers/editController.js";

const router = express.Router();

// router to simple edits in Database => edit type for id
router.post("/edit/:type/:id", genericUpdate);

export default router;
