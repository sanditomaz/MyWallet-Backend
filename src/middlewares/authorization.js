import db from "../database/db.js";

async function validateUser(req, res, next) {
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

    res.locals.user = user;

    next();
  } catch (error) {
    res.sendStatus(500);
  }
}

export default validateUser;
