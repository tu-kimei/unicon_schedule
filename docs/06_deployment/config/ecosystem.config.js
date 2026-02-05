/**
 * PM2 Ecosystem Configuration for Unicon Schedule
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'unicon-schedule',
      script: 'npm',
      args: 'start',
      cwd: './.wasp/build',
      
      // Cluster mode for better performance
      instances: 2,
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      // Load environment from file
      env_file: './.env.server',
      
      // Logging
      error_file: '/var/log/unicon/error.log',
      out_file: '/var/log/unicon/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      
      // Cron restart (optional - restart every day at 3 AM)
      // cron_restart: '0 3 * * *',
    },
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/unicon_schedule.git',
      path: '/var/www/unicon_schedule',
      'post-deploy': 'npm install && wasp build && pm2 reload ecosystem.config.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
