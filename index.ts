import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function createToken(id: number) {
  //@ts-ignore
  const token = jwt.sign({ id: id }, process.env.MY_SECRET, {
    expiresIn: '3days'
  });
  return token;
}

async function getUserFromToken(token: string) {
  //@ts-ignore
  const data = jwt.verify(token, process.env.MY_SECRET);
  const user = await prisma.user.findUnique({
    // @ts-ignore
    where: { id: data.id },
    select: {
      id: true,
      email: true,
      username: true,
      image: true
    }
  });

  return user;
}

const prisma = new PrismaClient({
  log: ['query', 'error', 'info', 'warn']
});

const PORT = 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.listen(PORT, () => console.log(`Server up: http://localhost:${PORT}`));

app.get('/users/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const user = await prisma.user.findUnique({
      // @ts-ignore
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        image: true
      }
    });
    if (user) res.send(user);
    else res.status(404).send({ error: 'User not found!' });
  } catch (err) {
    //@ts-ignore
    res.status(400).send({ error: err.message });
  }
});
app.post('/sign-up', async (req, res) => {
  const { email, username, password, image } = req.body;

  try {
    const hash = bcrypt.hashSync(password);
    const user = await prisma.user.create({
      data: { email, username, password: hash, image },
      select: {
        id: true,
        email: true,
        username: true,
        image: true
      }
    });
    res.send({ user, token: createToken(user.id) });
  } catch (err) {
    // @ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.post('/sign-in', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    // @ts-ignore
    const passwordMatches = bcrypt.compareSync(password, user.password);
    //@ts-ignore
    delete user.password;
    if (user && passwordMatches) {
      res.send({ user, token: createToken(user.id) });
    } else {
      throw Error('Boom');
    }
  } catch (err) {
    res.status(400).send({ error: 'Email/password invalid.' });
  }
});

app.get('/validate', async (req, res) => {
  const token = req.headers.authorization || '';

  try {
    const user = await getUserFromToken(token);
    res.send(user);
  } catch (err) {
    // @ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.get('/answers/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      const answers = await prisma.question.findMany({
        where: { userId: user.id, isAnswered: true },
        include: { asker: { select: { username: true } } }
      });
      res.send(answers);
    } else {
      res.status(404).send({ error: 'User not found!' });
    }
  } catch (err) {
    // @ts-ignore
    res.status(400).send({ error: err.message });
  }
});

app.post('/questions', async (req, res) => {
  const token = req.headers.authorization || '';
  const { question, username } = req.body;
  try {
    const asker = await getUserFromToken(token);
    if (!asker) {
      res
        .status(401)
        .send({ error: 'You need to be signed in to post a question' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(404).send({ error: 'User not found!' });
      return;
    }
    await prisma.question.create({
      data: { question, askerId: asker.id, userId: user.id }
    });
    res.send({ message: 'Question successfully asked!' });
  } catch (err) {
    //@ts-ignore
    res.send({ error: err.message });
  }
});

app.get('/questions', async (req, res) => {
  const token = req.headers.authorization || '';
  try {
    const user = await getUserFromToken(token);
    if (!user) throw Error('Boom');
    const questions = await prisma.question.findMany({
      where: { userId: user.id, isAnswered: false },
      include: { asker: { select: { username: true } } }
    });
    res.send(questions);
  } catch (err) {
    //@ts-ignore
    res
      .status(401)
      .send({ error: `Only signed in users can see their questions` });
  }
});
