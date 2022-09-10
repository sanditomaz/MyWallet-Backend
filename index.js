import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const mongoClient = new MongoClient(process.env.MONGO_URI);
console.log(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("MyWallet");
});

const signUpSchema = joi.object({
  name: joi.string().trim().min(1).required(),
  email: joi.string().email().min(3).required(),
  password: joi.string().min(1).required(),
  confirm_password: joi.string().required(),
});

const loginSchema = joi.object({
  email: joi.string().email().min(3).required(),
  password: joi.string().min(1).required(),
});

app.post("/register", async (req, res) => {
  const validation = signUpSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  if (req.body.password !== req.body.confirm_password) {
    res.status(401).send("Password didn't match");
    return;
  }

  try {
    const userEmail = await db.collection("userData").find().toArray();

    const validUser = userEmail.find((value) => value.email === req.body.email);

    if (validUser) {
      res.sendStatus(409);
      return;
    }

    await db.collection("userData").insertOne(req.body);

    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/login", async (req, res) => {
  const validation = loginSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  try {
    const userEmail = await db.collection("userData").find().toArray();

    const validUser = userEmail.find(
      (value) =>
        value.email === req.body.email && value.password === req.body.password
    );

    if (!validUser) {
      res.sendStatus(409);
      return;
    }

    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(5000, () => console.log("Listening on port 5000"));
