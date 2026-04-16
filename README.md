# ai-setup

Yuri's AI coding setup. One command installs skills, patches Claude config, and drops `AGENTS.md` into any project.

## Install

```sh
npx github:yuritoledo/ai-setup
```

Then in Claude Code:

```
/reload-plugins
```

## What it does

- Copies skills to `~/.claude/skills/`
- Patches `~/.claude/settings.json` — adds this repo as a plugin marketplace and enables the `main` plugin
- Copies `AGENTS.md` into the current directory

## Adding new skills

Drop a folder into `plugins/main/skills/` following the standard skill format, then push.
