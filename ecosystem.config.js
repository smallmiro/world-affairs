module.exports = {
  apps: [
    {
      name: "world-affairs-web",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "world-affairs-batch",
      script: "npx",
      args: "tsx batch/scheduler.ts",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
