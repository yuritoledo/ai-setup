#!/usr/bin/env node
const { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync } = require("fs")
const { join, resolve } = require("path")
const { homedir } = require("os")

const repoRoot = resolve(__dirname)
const claudeConfigDirectory = join(homedir(), ".claude")
const claudeSettingsPath = join(claudeConfigDirectory, "settings.json")
const skillsSourceDirectory = join(repoRoot, "plugins", "main", "skills")
const skillsTargetDirectory = join(claudeConfigDirectory, "skills")
const agentsSourcePath = join(repoRoot, "AGENTS.md")
const agentsTargetPath = join(process.cwd(), "AGENTS.md")

mkdirSync(skillsTargetDirectory, { recursive: true })
cpSync(skillsSourceDirectory, skillsTargetDirectory, { recursive: true })

const existingSettings = existsSync(claudeSettingsPath)
  ? JSON.parse(readFileSync(claudeSettingsPath, "utf8"))
  : {}

const patchedSettings = {
  ...existingSettings,
  extraKnownMarketplaces: {
    ...existingSettings.extraKnownMarketplaces,
    yuritoledo: {
      source: {
        source: "github",
        repo: "yuritoledo/ai-setup",
      },
    },
  },
  enabledPlugins: {
    ...existingSettings.enabledPlugins,
    "main@yuritoledo": true,
  },
}

writeFileSync(claudeSettingsPath, JSON.stringify(patchedSettings, null, 2))

cpSync(agentsSourcePath, agentsTargetPath)

console.log("Skills installed to ~/.claude/skills/")
console.log("Settings patched (~/.claude/settings.json)")
console.log("AGENTS.md copied to current directory")
console.log("")
console.log("Run /reload-plugins in Claude Code to activate.")
