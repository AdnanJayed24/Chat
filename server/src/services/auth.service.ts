import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export const register = async (name: string, email: string, password: string) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, 'Email already registered');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { user, token };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const token = signToken({ userId: user.id, email: user.email });
  return { user: { id: user.id, name: user.name, email: user.email }, token };
};
