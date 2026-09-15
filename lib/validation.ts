import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  businessName: z.string().min(2).max(150),
});

export const signinSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
