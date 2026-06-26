import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Master Password bypass
        if (process.env.MASTER_PASSWORD && credentials.password === process.env.MASTER_PASSWORD) {
          const existingUser = await prisma.user.findUnique({
            where: { username: credentials.username },
          });
          if (existingUser) {
            return { 
              id: existingUser.id.toString(), 
              name: existingUser.username,
              role: existingUser.role,
              restaurantId: existingUser.restaurantId
            };
          } else {
            return null; // Aún con clave maestra, el usuario debe existir
          }
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return { 
          id: user.id.toString(), 
          name: user.username,
          role: user.role,
          restaurantId: user.restaurantId
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.restaurantId = token.restaurantId as number | null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'supersecretkeyplanb',
};
