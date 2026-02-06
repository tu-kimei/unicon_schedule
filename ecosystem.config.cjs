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
      script: '/bin/bash',
      args: './start.sh',
      cwd: '/home/kimei-user/workspace/unicon_schedule/.wasp/build/server',
      interpreter: 'none',
      
      // Fork mode for bash script
      instances: 1,
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://unicon_user:Unicon%402025@localhost:5432/unicon_schedule',
        JWT_SECRET: '83cf484036e941c954c31e97ccfcccce1abe33b090471f94dbc6c28d11905338',
        SESSION_SECRET: 'XujtuyM76kpC8cmrfw_yBLPUAMTja7p3qcu1d8pl07U',
        SMTP_HOST: 'smtp.larksuite.com',
        SMTP_PORT: 465,
        SMTP_USERNAME: 'no-reply@unicon.ltd',
        SMTP_PASSWORD: 'Ubkv9EAS9SXqefoa',
        SMTP_TLS: true,
        WASP_WEB_CLIENT_URL: 'https://tuctuc.kimei.dev',
        WASP_SERVER_URL: 'https://tuctuc.kimei.dev',
        UPLOAD_DIR: './uploads',
      },
      
      // Logging
      error_file: '/home/kimei-user/logs/unicon/error.log',
      out_file: '/home/kimei-user/logs/unicon/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      
      // Cron restart (optional - restart every day at 3 AM)
      // cron_restart: '0 3 * * *',
    },
  ],
};
