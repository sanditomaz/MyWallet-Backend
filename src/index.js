import express from "express";
import cors from "cors";
import {
  createUser,
  userLogin,
  userLogOff,
} from "./controllers/user.controller.js";
import {
  addUserMoney,
  addUserWithdraw,
  showUserTransactions,
} from "./controllers/transaction.controller.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/register", createUser);
app.post("/login", userLogin);
app.post("/home", userLogOff);

app.post("/addmoney", addUserMoney);
app.post("/withdraw", addUserWithdraw);
app.get("/home", showUserTransactions);

app.listen(5000, () => console.log("Listening on port 5000"));
