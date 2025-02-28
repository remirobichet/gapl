#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import pkg from "../package.json" assert { type: "json" };

const mainCommand = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  args: {},
  run: async ({ args }) => {
    consola.log(`✨ Successfully pral \n`);
  },
});

runMain(mainCommand);
