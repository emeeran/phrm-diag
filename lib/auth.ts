import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { verifyMfaToken } from "./mfa"
import { createAuditLog } from "./audit"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        // Check if account is locked
        if (user.accountLocked && user.lockExpires && user.lockExpires > new Date()) {
          await createAuditLog({
            userId: user.id,
            action: "login_failed",
            resourceType: "user",
            resourceId: user.id,
            description: "Login attempt on locked account",
          });
          throw new Error("Your account is temporarily locked. Please try again later.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          // Increment failed login attempts
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          
          // Lock account after 5 failed attempts
          const updateData: any = { failedLoginAttempts: failedAttempts };
          if (failedAttempts >= 5) {
            // Lock for 15 minutes
            const lockExpires = new Date();
            lockExpires.setMinutes(lockExpires.getMinutes() + 15);
            updateData.accountLocked = true;
            updateData.lockExpires = lockExpires;
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
          
          await createAuditLog({
            userId: user.id,
            action: "login_failed",
            resourceType: "user",
            resourceId: user.id,
            description: "Failed login attempt (invalid password)",
          });
          
          return null
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
          // Check if MFA token is provided
          if (!credentials.mfaToken) {
            return { 
              id: user.id,
              email: user.email,
              name: user.name,
              requiresMfa: true
            }
          }
          
          // Verify MFA token
          const isValidToken = await verifyMfaToken(user.id, credentials.mfaToken);
          
          if (!isValidToken) {
            await createAuditLog({
              userId: user.id,
              action: "login_failed",
              resourceType: "user",
              resourceId: user.id,
              description: "Failed login attempt (invalid MFA token)",
            });
            throw new Error("Invalid verification code");
          }
        }
        
        // Reset failed login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            failedLoginAttempts: 0,
            accountLocked: false,
            lockExpires: null,
            lastLoginAt: new Date(),
            lastLoginIp: credentials.ip || null
          },
        });
        
        await createAuditLog({
          userId: user.id,
          action: "login",
          resourceType: "user",
          resourceId: user.id,
          description: "Successful login",
          ipAddress: credentials.ip,
          userAgent: credentials.userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        }
      }
    }
  }
}
