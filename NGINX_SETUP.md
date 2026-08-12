# Nginx Reverse Proxy & Load Balancer Guide

This document provides a production-ready **Nginx** configuration for serving as a **Reverse Proxy** and **Load Balancer** for the **Digital Alpha Rewards Dashboard**.

When your application scales up (multiple backend API replicas and Next.js frontend instances), Nginx will sit in front as the single entry point, distributing incoming traffic efficiently while securing your application.

---

## 1. Nginx Architecture Overview

```
                          ┌────────────────────────┐
                          │     Client / Browser   │
                          └───────────┬────────────┘
                                      │ (HTTP / HTTPS: Port 80 / 443)
                                      ▼
                          ┌────────────────────────┐
                          │   Nginx Reverse Proxy  │
                          └─────┬────────────┬─────┘
                                │            │
           / (Frontend App)     │            │  /api/ (Backend API)
           ┌────────────────────┘            └────────────────────┐
           ▼                                                      ▼
┌───────────────────────┐                             ┌───────────────────────┐
│ Next.js App Instance  │                             │ Backend Cluster       │
│ (http://127.0.0.1:3000)│                             │ (Round Robin Balancer)│
└───────────────────────┘                             └───────────┬───────────┘
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            ▼                                           ▼
                                 ┌────────────────────┐                      ┌────────────────────┐
                                 │ FastAPI Server #1  │                      │ FastAPI Server #2  │
                                 │ (127.0.0.1:8000)   │                      │ (127.0.0.1:8001)   │
                                 └────────────────────┘                      └────────────────────┘
```

---

## 2. Production `nginx.conf` Implementation

Create an `nginx.conf` file in your repository when ready to deploy:

```nginx
# User and worker processes configuration
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate Limiting (Protects against DDoS and brute force)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

    # ── 1. Upstream Backend Cluster (Load Balancer) ────────────
    # Load balances requests across multiple FastAPI backend instances
    upstream backend_cluster {
        least_conn; # Routes to instance with fewest active connections
        
        server 127.0.0.1:8000 max_fails=3 fail_timeout=10s;
        server 127.0.0.1:8001 max_fails=3 fail_timeout=10s;
        # server 127.0.0.1:8002 max_fails=3 fail_timeout=10s; # Add more instances here
    }

    # ── 2. Upstream Frontend Server ────────────────────────────
    upstream frontend_server {
        server 127.0.0.1:3000;
    }

    # ── 3. Server Block (Reverse Proxy) ────────────────────────
    server {
        listen 80;
        server_name localhost rewards.yourdomain.com;

        # Redirect HTTP to HTTPS (Enable in production with SSL)
        # return 301 https://$host$request_uri;

        client_max_body_size 10M;

        # ── Backend API Proxying (/api/ -> backend_cluster) ────
        location /api/ {
            # Apply rate limiting
            limit_req zone=api_limit burst=10 nodelay;

            # Strip /api prefix before forwarding to backend
            rewrite ^/api/(.*)$ /$1 break;

            proxy_pass http://backend_cluster;
            proxy_http_version 1.1;

            # Forward original request headers to backend
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket & HTTP/1.1 support
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_read_timeout 60s;
            proxy_send_timeout 60s;
        }

        # ── Next.js Frontend Proxying (/) ──────────────────────
        location / {
            proxy_pass http://frontend_server;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Custom Error Pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

---

## 3. Key Nginx Configuration Explanations

| Directive | Purpose |
|---|---|
| `upstream backend_cluster` | Defines the group of backend FastAPI servers for load balancing. |
| `least_conn` | Load balancing algorithm that sends new requests to the backend server with the least active connections. |
| `limit_req_zone` | Defines rate limits (20 requests per second per IP) to prevent server overload. |
| `proxy_pass` | Forwards incoming HTTP requests to target upstream backend/frontend servers. |
| `proxy_set_header X-Forwarded-For` | Preserves the client's real IP address so FastAPI can log correct client IPs. |
| `rewrite ^/api/(.*)$ /$1 break` | Strips `/api/` prefix when proxying so backend receives cleanly formatted routes like `/transactions`. |

---

## 4. Docker Integration Example

When scaling up, add an Nginx container to `docker-compose.yml`:

```yaml
  nginx:
    image: nginx:alpine
    container_name: da-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
```
