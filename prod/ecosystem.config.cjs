module.exports = {
  apps: [
    {
      name: "web",
      script: "./server.js",
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
