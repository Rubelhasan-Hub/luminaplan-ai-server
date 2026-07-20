import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { isFallback, getFallbackDb, saveFallbackDb } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenkeyforluminaplanai123';

const createToken = (user: { id: string; email: string; name: string; role: string }) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isFallback()) {
      const db = getFallbackDb();
      if (db.users.find((u: any) => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date()
      };

      db.users.push(newUser);
      saveFallbackDb(db);

      const token = createToken({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
      return res.status(201).json({
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    } else {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = new User({
        name,
        email,
        password: hashedPassword
      });
      await user.save();

      const token = createToken({ id: user._id.toString(), email: user.email, name: user.name, role: user.role });
      return res.status(201).json({
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (isFallback()) {
      const db = getFallbackDb();
      const user = db.users.find((u: any) => u.email === email);

      if (!user || !user.password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = createToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } else {
      const user = await User.findOne({ email });
      if (!user || !user.password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = createToken({ id: user._id.toString(), email: user.email, name: user.name, role: user.role });
      return res.json({
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Demo / Guest Login
router.post('/demo', async (req: Request, res: Response) => {
  try {
    const demoUser = {
      id: 'demo-planner-123',
      name: 'Guest Planner',
      email: 'planner.demo@luminaplan.ai',
      role: 'planner'
    };

    const token = createToken(demoUser);
    return res.json({
      token,
      user: demoUser
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error generating demo token' });
  }
});

// Google Social Login (mock endpoint generating a valid JWT from the client identity)
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Google authentication details missing' });
    }

    let userPayload: any;

    if (isFallback()) {
      const db = getFallbackDb();
      let user = db.users.find((u: any) => u.email === email);

      if (!user) {
        user = {
          id: `google-${googleId || Math.random().toString(36).substr(2, 9)}`,
          name,
          email,
          role: 'user',
          createdAt: new Date()
        };
        db.users.push(user);
        saveFallbackDb(db);
      }

      userPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
    } else {
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          name,
          email,
          role: 'user'
        });
        await user.save();
      }

      userPayload = { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
    }

    const token = createToken(userPayload);
    return res.json({
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

export default router;
