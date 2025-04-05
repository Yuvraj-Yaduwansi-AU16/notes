import type { SSTConfig } from "sst";
import {Config, NextjsSite } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "notes",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const SECRET_KEY = new Config.Secret(stack, "SECRET_KEY");
      const AUTH_SECRET = new Config.Secret(stack, "AUTH_SECRET");
      const AUTH_GOOGLE_ID = new Config.Secret(stack, "AUTH_GOOGLE_ID");
      const AUTH_GOOGLE_SECRET = new Config.Secret(stack, "AUTH_GOOGLE_SECRET");
      const NEXT_PUBLIC_SUPABASE_URL = new Config.Secret(stack, "NEXT_PUBLIC_SUPABASE_URL");
      const NEXT_PUBLIC_SUPABASE_ANON_KEY = new Config.Secret(stack, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
      const DATABASE_URL = new Config.Secret(stack, "DATABASE_URL");
      const DIRECT_URL = new Config.Secret(stack, "DIRECT_URL");
      const site = new NextjsSite(stack, "NextSite", {
        path: ".",
        bind: [SECRET_KEY, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, DIRECT_URL],
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
