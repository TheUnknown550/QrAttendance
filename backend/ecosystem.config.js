module.exports = {
  apps: [
    {
      name: "qrattendance-client-backend",
      script: "dist/src/server.js",
      cwd: __dirname,
      exec_mode: "cluster",
      instances: 2,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
