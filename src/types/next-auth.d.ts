import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      restaurantId: number | null;
      managedRestaurants?: { id: number, name: string, slug: string }[];
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: string;
    restaurantId: number | null;
    managedRestaurants?: { id: number, name: string, slug: string }[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    restaurantId: number | null;
    managedRestaurants?: { id: number, name: string, slug: string }[];
  }
}
