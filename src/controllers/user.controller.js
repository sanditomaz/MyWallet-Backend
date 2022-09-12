import joi from "joi";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db.js";
import bcrypt from "bcrypt";

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

async function createUser(req, res) {
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
}

async function userLogin(req, res) {
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
}

async function userLogOff(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.send(401);
  }

  try {
    const session = await db.collection("sessions").deleteOne({
      token,
    });
    res.send(200);
  } catch (error) {
    res.sendStatus(500);
  }
}

export { createUser, userLogin, userLogOff };
