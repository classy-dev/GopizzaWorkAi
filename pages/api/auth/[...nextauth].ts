import bcrypt from 'bcrypt';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  // PrismaAdapter 제거 - Credentials 프로바이더만 사용
  providers: [
    CredentialsProvider({
      name: '로그인',
      credentials: {
        userId: { label: '아이디', type: 'text' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.password) {
          return null;
        }

        // 사용자 ID로 사용자 찾기
        const user = await prisma.user.findUnique({
          where: { userId: credentials.userId },
        });

        // 사용자가 없거나 비밀번호가 일치하지 않으면 null 반환
        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          return null;
        }

        // 인증 성공 시 사용자 정보 반환 (NextAuth User 타입에 맞게)
        return {
          id: user.id,
          name: user.name,
          department: user.department,
          userId: user.userId,
          apiKey: user.apiKey || undefined,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userId = user.userId;
        token.department = user.department;
        token.apiKey = user.apiKey;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.userId = token.userId as string;
        session.user.department = token.department as string;
        session.user.apiKey = token.apiKey as string | undefined;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
