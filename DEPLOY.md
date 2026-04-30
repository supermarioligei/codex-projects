# 服务器上线说明

这套系统当前最适合先用 `Node.js + PM2 + Nginx` 部署到一台云服务器，供公司内部试用。

## 1. 服务器建议

- 系统：`Ubuntu 22.04`
- 配置：`2C 4G` 起步
- Node.js：`20.x`
- 进程管理：`PM2`
- 反向代理：`Nginx`

## 2. 目录建议

```bash
/var/www/studio-admin
/var/lib/tongying-studio/data
/var/lib/tongying-studio/backups
```

- `/var/www/studio-admin`：放代码
- `/var/lib/tongying-studio/data`：放真实业务数据
- `/var/lib/tongying-studio/backups`：放备份文件

## 3. 拉代码

```bash
cd /var/www
git clone https://github.com/supermarioligei/codex-projects.git studio-admin
cd /var/www/studio-admin
```

## 4. 安装依赖

```bash
npm install
```

## 5. 配置环境变量

```bash
cp .env.example .env
mkdir -p /var/lib/tongying-studio/data
mkdir -p /var/lib/tongying-studio/backups
```

建议把 `.env` 至少改成：

```bash
NODE_ENV=production
PORT=3000
STUDIO_DATA_DIR=/var/lib/tongying-studio/data
APP_BASE_URL=https://your-domain.com
```

## 6. 首次放入数据

测试阶段可以先把本地演示数据复制到服务器数据目录：

```bash
cp data/*.json /var/lib/tongying-studio/data/
```

后续系统会直接读写 `/var/lib/tongying-studio/data`，代码更新不会覆盖这批数据。

## 7. 构建并启动

```bash
npm run build
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

查看状态：

```bash
pm2 status
pm2 logs studio-admin
```

## 8. 健康检查

应用启动后可检查：

```bash
curl http://127.0.0.1:3000/healthz
```

返回 `ok: true` 说明服务正常。

## 9. Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

如果域名已备案并接好证书，再继续上 HTTPS。

## 10. 更新发布

```bash
cd /var/www/studio-admin
git pull origin main
npm install
npm run build
pm2 restart studio-admin
```

## 11. 数据备份

手动执行：

```bash
STUDIO_DATA_DIR=/var/lib/tongying-studio/data \
BACKUP_DIR=/var/lib/tongying-studio/backups \
bash scripts/backup-data.sh
```

建议再配一个 `crontab`，每天凌晨自动备份一次。

## 12. 当前阶段的上线提醒

- 现在仍是 `JSON` 本地文件存储，适合内部试用，不适合大规模正式运营
- 多人同时频繁编辑时，后续仍建议尽快切到数据库
- 财务数据目前没有审计日志，正式使用前建议补操作记录和备份策略
