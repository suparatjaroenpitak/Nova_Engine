# Backblaze B2 — Replace MinIO for Free Asset Storage

Backblaze B2 is S3-compatible and gives 10GB free storage.
The API uses `IObjectStorage` which works with any S3 endpoint — just swap config.

## Setup

1. **Create account**: https://www.backblaze.com/sign-up/cloud-storage
2. **Create a bucket**:
   - Name: `nova-assets`
   - Type: Private
3. **Generate Application Key**:
   - Go to App Keys → Generate New Master Application Key
   - Copy: `Key ID` and `applicationKey`
4. **Find your S3 endpoint**:
   - Go to Buckets → click your bucket → "Bucket Settings"
   - S3 Endpoint: `https://s3.us-west-004.backblazeb2.com` (your region may differ)

## Environment Variables (set in Render dashboard)

```
MinIO__Endpoint=s3.us-west-004.backblazeb2.com
MinIO__AccessKey=005xxxxxxxxxxxxxxxxxxxxxx
MinIO__SecretKey=K005xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MinIO__Bucket=nova-assets
MinIO__Secure=true
```

No code changes needed — the S3 SDK handles B2 transparently.
