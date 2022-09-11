import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
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

const transactionSchema = joi.object({
  description: joi.string().trim().min(1).required(),
  number: joi.string().trim().min(1).required(),
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

  const hashPassword = bcrypt.hashSync(req.body.password, 10);

  try {
    const userEmail = await db.collection("userData").find().toArray();

    const validUser = userEmail.find((value) => value.email === req.body.email);

    if (validUser) {
      res.sendStatus(409);
      return;
    }

    await db.collection("userData").insertOne({
      name: req.body.name,
      email: req.body.email,
      password: hashPassword,
    });

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
        value.email === req.body.email &&
        bcrypt.compareSync(req.body.password, value.password)
    );

    if (!validUser) {
      res.sendStatus(401);
      return;
    }

    const token = {
      name: validUser.name,
      token: uuidv4(),
      userId: validUser._id,
    };

    db.collection("sessions").insertOne(token);

    res.send(token);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/addmoney", async (req, res) => {
  const validation = transactionSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.send(401);
  }

  try {
    const session = await db.collection("sessions").findOne({
      token,
    });

    if (!session) {
      return res.send(401);
    }

    const user = await db.collection("userData").findOne({
      _id: session.userId,
    });

    if (user) {
      delete user.password;
    }

    const insertMoney = {
      value: req.body.number,
      description: req.body.description,
      status: "green",
      date: dayjs().format("MM/DD"),
      userId: user._id,
    };

    db.collection("transactions").insertOne(insertMoney);

    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.post("/withdraw", async (req, res) => {
  const validation = transactionSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.send(401);
  }

  try {
    const session = await db.collection("sessions").findOne({
      token,
    });

    if (!session) {
      return res.send(401);
    }

    const user = await db.collection("userData").findOne({
      _id: session.userId,
    });

    if (user) {
      delete user.password;
    }

    const withdrawal = {
      value: req.body.number,
      description: req.body.description,
      status: "red",
      date: dayjs().format("MM/DD"),
      userId: user._id,
    };

    db.collection("transactions").insertOne(withdrawal);

    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/home", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.send(401);
  }

  try {
    const session = await db.collection("sessions").findOne({
      token,
    });

    if (!session) {
      return res.send(401);
    }

    const user = await db.collection("userData").findOne({
      _id: session.userId,
    });

    if (user) {
      delete user.password;
    }

    const transaction = await db
      .collection("transactions")
      .find({
        userId: session.userId,
      })
      .toArray();

    res.send(transaction);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(5000, () => console.log("Listening on port 5000"));
