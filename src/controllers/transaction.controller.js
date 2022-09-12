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

  try {
    const user = res.locals.user;

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

  try {
    const user = res.locals.user;

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
  try {
    const user = res.locals.user;

    const transaction = await db
      .collection("transactions")
      .find({
        userId: user._id,
      })
      .toArray();

    res.send(transaction);
  } catch (error) {
    res.sendStatus(500);
  }
}

export { addUserMoney, addUserWithdraw, showUserTransactions };
