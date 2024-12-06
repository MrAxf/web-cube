import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { group } from "console";

const docs = defineCollection({
    loader: glob({
        pattern: ["**/*.mdx", "**/*.md"],
        base: "./src/content/docs",
    }),
    schema: z.object({
        id: z.string(),
        title: z.string(),
        group: z.string(),
        path: z.string(),
        groupOrder: z.number(),
        order: z.number(),
    }),
});

export const collections = { docs };
