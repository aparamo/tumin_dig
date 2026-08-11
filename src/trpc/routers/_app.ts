import { createTRPCRouter, publicProcedure } from "../../lib/trpc/server";
import { z } from "zod";
import { userRouter } from "./user";
import { walletRouter } from "./wallet";
import { miningRouter } from "./mining";
import { bazarRouter } from "./bazar";
import { jobsRouter } from "./jobs";
import { auditRouter } from "./audit";
import { adsRouter } from "./ads";
import { smartAdsRouter } from "./smartAds";
import { passwordResetRouter } from "./passwordReset";
import { directoryRouter } from "./directory";

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  user: userRouter,
  wallet: walletRouter,
  mining: miningRouter,
  bazar: bazarRouter,
  jobs: jobsRouter,
  audit: auditRouter,
  ads: adsRouter,
  smartAds: smartAdsRouter,
  passwordReset: passwordResetRouter,
  directory: directoryRouter,
});

export type AppRouter = typeof appRouter;
