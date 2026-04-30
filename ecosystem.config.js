module.exports = {
  apps: [
    {
      name: "studio-admin",
      cwd: "/var/www/studio-admin",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        STUDIO_DATA_DIR: "/var/lib/tongying-studio/data",
      },
    },
  ],
};
