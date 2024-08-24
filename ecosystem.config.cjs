module.exports = {
  apps: [
    {
      name: "web",
      script: "./build/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 7777,
      },
      interpreter_args: "--env-file ./.env",
      instances: "max",
      exec_mode: "cluster",
    },
  ],
};
