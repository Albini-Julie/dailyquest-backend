import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from './userModel';

const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier doublons
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email ou nom d’utilisateur déjà utilisé' });
    }

    const user = await UserModel.create({ username, email, password });

    res.status(201).json({
      token: generateToken(user),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    res.json({
      token: generateToken(user),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
