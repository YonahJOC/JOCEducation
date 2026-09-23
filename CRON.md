# The JOC App sync schedule

`vercel.json` runs `/api/app-sync` **once a day, at 06:00 UTC**.

That is not the schedule this was designed for. It should be every 15 minutes:

```json
"schedule": "*/15 * * * *"
```

## Why it is daily

The Vercel **Hobby** plan allows cron jobs to run **once a day**. A more
frequent schedule is rejected and **the whole deployment fails** — which is
exactly what happened: four commits stopped shipping the moment this file was
added with `*/15 * * * *`, and nothing said why beyond a failed build.

## Change it after the move to the paid team

1. Open `vercel.json`.
2. Set the schedule to `*/15 * * * *`.
3. Commit and push.

Until then the console's figures can be up to 24 hours old. It says so on its
own — anything past 45 minutes shows the orange "Sync stopped" banner — so a
daily sync will look stale for most of the day, and that is honest rather than
broken.
