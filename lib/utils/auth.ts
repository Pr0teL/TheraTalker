import { NextAuthOptions } from "next-auth";

//Providers
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import GitlabProvider from "next-auth/providers/gitlab";
import EmailProvider from "next-auth/providers/email";

//Adapter
import { Adapter } from "next-auth/adapters";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

//db init
import clientPromise from "./db";
import { ObjectId } from "mongodb";
import { access } from "fs";

export const authOptions = {
  theme: {
    colorScheme: "light", // "auto" | "dark" | "light"
    brandColor: "#7b39ed", // Hex color code
    logo: "/TheraTalkerFullLogo.png", // Absolute URL to image
    buttonText: ""
  },
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Accounts: "accounts",
      Sessions: "sessions",
      Users: "users",
      VerificationTokens: "verificationTokens",
    },
    databaseName: process.env.DB_NAME,
  }) as Adapter,
  providers: [
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
    // GitlabProvider({
    //   clientId: process.env.GITLAB_CLIENT_ID!,
    //   clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    // }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: process.env.EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    //    // comment this func in prod (for debug email confirmation)
    //   sendVerificationRequest({ url, identifier }) {
    //     console.log("Magic link for", identifier, ":", url);
    //   },

    // }),
  ],
  events: {
    async createUser({ user }) {
      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection("users");
      await usersCollection.updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            role: 'user',
            tokens: 150
          },
        }
      );
    },
  },
  callbacks: {
    async session({ session, user, token }) {
      // Получаем пользователя из базы данных по email
      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection("users");
      const dbUser = await usersCollection.findOne({ email: session.user?.email });

      // Добавляем role в сессию
      if (session.user && dbUser && dbUser.role) {
        session.user.role = dbUser.role;
        session.user.tokens = dbUser.tokens ? dbUser.tokens : 150;
      }

      return session;
    },
  },
} satisfies NextAuthOptions;
