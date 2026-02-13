# Docker Compose for MinIO

This setup provides a local MinIO S3-compatible storage server for development and testing of the S3 Storage Manager frontend.

## Quick Start

```bash
# Start MinIO
docker-compose up -d

# Stop MinIO
docker-compose down

# Stop MinIO and remove volumes (delete all data)
docker-compose down -v
```

## MinIO Access

| Service | URL | Credentials |
|---------|-----|-------------|
| **API Endpoint** | http://localhost:9000 | Username: `minioadmin`<br>Password: `minioadmin123` |
| **Web Console** | http://localhost:9001 | Username: `minioadmin`<br>Password: `minioadmin123` |

## Connecting from the Frontend

1. Start the frontend: `npm run dev`
2. Navigate to http://localhost:5173
3. Click "Add New Connection"
4. Fill in the form with:
   - **Connection Name**: Local MinIO (or any name you prefer)
   - **Endpoint URL**: `http://localhost:9000`
   - **Access Key ID**: `minioadmin`
   - **Secret Access Key**: `minioadmin123`
   - **Region**: `us-east-1`

## Pre-created Buckets

The following buckets are automatically created on startup:
- `test-bucket`
- `uploads`
- `backups`

## Configuration

The MinIO container configuration in [`docker-compose.yml`](docker-compose.yml):

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"  # API
      - "9001:9001" # Console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
```

### Changing Credentials

Edit the `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` environment variables in [`docker-compose.yml`](docker-compose.yml), then:

```bash
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

If port 9000 or 9001 is already in use, change the port mapping in [`docker-compose.yml`](docker-compose.yml):

```yaml
ports:
  - "9002:9000"  # Use port 9002 instead of 9000
  - "9003:9001"  # Use port 9003 instead of 9001
```

Then update the endpoint URL in the frontend connection form to `http://localhost:9002`.

### Reset Data

To completely reset MinIO (delete all buckets and data):

```bash
docker-compose down -v
docker-compose up -d
```

### View Logs

```bash
docker-compose logs minio
docker-compose logs -f minio  # Follow logs
```

## Using MinIO CLI (mc)

You can also interact with MinIO using the MinIO client:

```bash
# Download and install mc
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure alias
mc alias set local http://localhost:9000 minioadmin minioadmin123

# List buckets
mc ls local

# Create a bucket
mc mb local/my-new-bucket

# Upload a file
mc cp ./file.txt local/my-new-bucket/

# Download a file
mc cp local/my-new-bucket/file.txt ./
```

## Production Deployment with GHCR

This project's Docker images are automatically published to GitHub Container Registry (GHCR) via CI/CD pipeline.

### Pull and Run

Pull the latest stable image:
```bash
docker pull ghcr.io/<owner>/<repo>:latest
docker run -d -p 8080:80 ghcr.io/<owner>/<repo>:latest
```

Pull a specific version:
```bash
docker pull ghcr.io/<owner>/<repo>:0.1.5
docker run -d -p 8080:80 ghcr.io/<owner>/<repo>:0.1.5
```

Pull the latest major.minor version:
```bash
docker pull ghcr.io/<owner>/<repo>:0.1
```

### Versioning

- **Format:** `0.1.{run_number}` (e.g., `0.1.1`, `0.1.2`)
- **Tags:** `<version>`, `0.1`, `latest`
- **Triggers:** Push to `main` branch or manual workflow dispatch
- **GitHub Release:** Created as `v<version>` (e.g., `v0.1.5`)

### Access

After starting the container, access the application at http://localhost:8080

---

## Production Considerations

**Warning:** This Docker Compose setup is for development only. For production:

1. Change default credentials to strong, randomly generated values
2. Enable TLS/HTTPS for secure connections
3. Configure proper backup and disaster recovery
4. Set up monitoring and alerting
5. Use a managed S3 service (AWS S3, DigitalOcean Spaces, etc.) for better reliability
