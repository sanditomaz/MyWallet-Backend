import joi from "joi";
import db from "../database/db.js";
import dayjs from "dayjs";

const transactionSchema = joi.object({
  description: joi.string().trim().min(1).required(),
  number: joi.string().trim().min(1).required(),
});

async function addUserMoney(req, res) {
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
}

async function addUserWithdraw(req, res) {
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
}

async function showUserTransactions(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).send("Unauthorized Access!");
  }

  try {
    const session = await db.collection("sessions").findOne({
      token,
    });

    if (!session) {
      return res.status(401).send("Unauthorized Access!");
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
}

export { addUserMoney, addUserWithdraw, showUserTransactions };
