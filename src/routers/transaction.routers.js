import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";

const router = express.Router();

router.post("/addmoney", transactionController.addUserMoney);
router.post("/withdraw", transactionController.addUserWithdraw);
router.get("/home", transactionController.showUserTransactions);

export default router;
