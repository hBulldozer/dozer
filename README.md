# Dozer Finance Monorepo

## Important Dependencies

Exercise caution when updating:

* **heroicons**
* **next**
* **superjson**
* **framer-motion**
* **tanstack/react-query**

These updates could introduce breaking changes.

---

## Introduction

This repository is a [Turbo](https://turbo.build/repo/docs "link to turbo docs") monorepo to build Interfaces for users to interact with Dozer Finance Smart Contracts hosted at Hathor Network.

It is built with [T3 Stack](https://create.t3.gg/en/introduction "link to T3 docs") primitives using [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html "link to typescript docs"), [Prisma](https://www.prisma.io/docs "link to prisma docs"), [trpc v10](https://trpc.io/docs/v10/ "link to trpc docs") and [Tailwind Css](https://v2.tailwindcss.com/docs "link to tailwind docs").

## Development Enviroment

### Requirements

* Node > 16
* Pnpm > 8
  
We recommend instaling node via nvm: <https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script>

Pnpm installation: <https://pnpm.io/installation>

### Database Connection

* We migrated from PlanetScale to Vercel, need to update this section

## Setup and Execution**

1. **Install dependencies:**
    * Open a command prompt or PowerShell in the project directory.
    * Run: `pnpm install`

2. **Configure environment:**
      * Copy `.env.example` to `.env`.
      * Edit `.env` and provide the necessary values.

3. **Generate Prisma schema:**
    * Run: `pnpm generate`

4. **Start development server:**
    * Run: `pnpm run dev`

---

**Let's get started!**
