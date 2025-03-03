#!/usr/bin/env node
import fs from "fs";
import { execSync } from 'child_process';

import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import pkg from "../package.json" assert { type: "json" };

function getCurrentGitBranch(): string {
  try {
    // Execute git command to get current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    return branch;
  } catch (error) {
    // Handle cases where git command fails or not in a git repository
    consola.error('Error getting git branch:', error);
    return '';
  }
}

function getLastCommitTitle(): string {
  try {
    // Execute git command to get the last commit message title
    // %s refers to the commit subject (title)
    const commitTitle = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim();
    return commitTitle;
  } catch (error) {
    consola.error('Error getting last commit title:', error);
    return '';
  }
}

const mainCommand = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  args: {},
  run: async ({ args }) => {
    /* Resolving config file */
    consola.info("Resolving config file...");
    const gaplFile = typeof args.file === "string" ? args.file : "gapl.json";
    consola.info("Using config file:", gaplFile);
    let gaplContent;
    try {
      gaplContent = await fs.promises.readFile(gaplFile, "utf-8");
    } catch (error) {
      consola.error(`Failed to read '${gaplFile}' file`);
      return;
    }

    /* JSON parse file */
    let gaplJson;
    try {
      gaplJson = JSON.parse(gaplContent);
    } catch (error) {
      consola.error("Failed to parse JSON file content");
      return;
    }
    consola.success("Content loaded");

    /* Use file content and prompt additionnal info */
    type UrlBuilder = {
      baseUrl?: string;
      destinationBranch?: string;
      title?: string;
      assignees?: string[];
    };
    const urlBuilderData: UrlBuilder = {};

    urlBuilderData.baseUrl = await consola.prompt("🔗 Github URL", {
      type: "text",
      initial: gaplJson.baseUrl,
      required: true,
    });

    urlBuilderData.destinationBranch = await consola.prompt("🌲 Destination branch", {
      type: "text",
      initial: gaplJson.destinationBranch,
      required: true,
    });

    urlBuilderData.title = await consola.prompt("📝 Title", {
      type: "text",
      initial: getLastCommitTitle(),
      required: false,
    });

    if (gaplJson.assigneesOptions) {
      urlBuilderData.assignees = await consola.prompt("👥 Assignees", {
        type: "multiselect",
        options: gaplJson.assigneesOptions,
        required: false,
      });
    }

    /* Final URL build */
    const title = encodeURIComponent(urlBuilderData.title)
    const assignees = urlBuilderData.assignees ? encodeURIComponent(urlBuilderData.assignees.join(",")) : ""
    const url = `${urlBuilderData.baseUrl}/compare/${urlBuilderData.destinationBranch}...${getCurrentGitBranch()}?expand=1&title=${title}&assignees=${assignees}`;
    consola.box("🚀 Url \n\n", url);
  },
});

runMain(mainCommand);
