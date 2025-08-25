module.exports = {
  apps: [
    {
      name: 'project-il',
      script: './app.js',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: './node_modules',
        PORT: 3000,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_USER: 'mypoint_user',
        DB_PASSWORD: 'AriCat0321!',
        DB_NAME: 'mypoint',
        JWT_SECRET: 'your_very_secret_key_here'
      }
    }
  ]
};
