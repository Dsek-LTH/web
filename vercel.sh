#!/bin/bash
 
if test "$VERCEL_ENV" = "production"
then 
  pnpm run build && pnpm prisma migrate deploy
else 
  # prod and preview use the same database.
  # We don't want to risk breaking it with a work-in-progress migration in a PR.
  pnpm run build
fi