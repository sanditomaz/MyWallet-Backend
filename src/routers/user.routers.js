import express from "express";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", userController.createUser);
router.post("/login", userController.userLogin);
router.post("/home", userController.userLogOff);

export default router;
