module.exports = {
  apps: [
    {
      name: "web",
      cwd: "./",
      script: "./prod/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 7777,
      },
      interpreter_args: "--env-file ./.env",
      exec_mode: "cluster",
      instances: 4,
    },
  ],
};
