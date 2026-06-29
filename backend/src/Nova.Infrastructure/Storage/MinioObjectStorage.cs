using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Microsoft.Extensions.Options;
using Nova.Application;
using Nova.Application.Abstractions;

namespace Nova.Infrastructure.Storage;

public sealed class MinioObjectStorage : IObjectStorage
{
    private readonly IAmazonS3 _s3;
    private readonly MinioOptions _options;

    public MinioObjectStorage(IAmazonS3 s3, IOptions<MinioOptions> options)
    {
        _s3 = s3;
        _options = options.Value;
    }

    public async Task<string> UploadAsync(string bucket, string objectName, Stream content, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(bucket, ct);
        var request = new PutObjectRequest
        {
            BucketName = bucket,
            Key = objectName,
            InputStream = content,
            ContentType = contentType
        };
        await _s3.PutObjectAsync(request, ct);
        return objectName;
    }

    public async Task<Stream?> DownloadAsync(string bucket, string objectName, CancellationToken ct = default)
    {
        try
        {
            var response = await _s3.GetObjectAsync(bucket, objectName, ct);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task DeleteAsync(string bucket, string objectName, CancellationToken ct = default)
    {
        await _s3.DeleteObjectAsync(bucket, objectName, ct);
    }

    public async Task EnsureBucketAsync(string bucket, CancellationToken ct = default)
    {
        if (!await AmazonS3Util.DoesS3BucketExistV2Async(_s3, bucket))
            await _s3.PutBucketAsync(bucket, ct);
    }

    public async Task<string> PresignedGetAsync(string bucket, string objectName, TimeSpan ttl, CancellationToken ct = default)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = objectName,
            Expires = DateTime.UtcNow.Add(ttl),
            Protocol = _options.Secure ? Protocol.HTTPS : Protocol.HTTP
        };
        return await _s3.GetPreSignedURLAsync(request);
    }
}
