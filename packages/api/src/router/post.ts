// packages/api/src/router/post.ts
// TODO (M0-2): Replace with Convex mutations/queries when Convex is set up
// Drizzle ORM removed - this is a stub until Convex is configured
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure, publicProcedure } from "../trpc";

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export const CreatePostSchema = z.object({
  title: z.string().max(256),
  content: z.string().max(256),
});

export const postRouter = {
  all: publicProcedure.query(() => {
    // TODO (M0-2): Replace with Convex query
    return [] as Post[];
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      // TODO (M0-2): Replace with Convex query
      void input;
      return null as Post | null;
    }),

  create: protectedProcedure.input(CreatePostSchema).mutation(({ input }) => {
    // TODO (M0-2): Replace with Convex mutation
    void input;
    return null;
  }),

  delete: protectedProcedure.input(z.string()).mutation(({ input }) => {
    // TODO (M0-2): Replace with Convex mutation
    void input;
    return null;
  }),
} satisfies TRPCRouterRecord;
