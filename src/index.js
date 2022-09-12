import express from "express";
import cors from "cors";
import userRouter from "./routers/user.routers.js";
import transactionRouter from "./routers/transaction.routers.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(userRouter);
app.use(transactionRouter);

app.listen(5000, () => console.log("Listening on port 5000"));
