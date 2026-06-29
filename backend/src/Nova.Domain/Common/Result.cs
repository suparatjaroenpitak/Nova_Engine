namespace Nova.Domain.Common;

/// <summary>
/// Lightweight result type for operations that can fail predictably (validation,
/// auth, not-found) without throwing. Keeps the controller layer declarative.
/// </summary>
public class Result
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public string? ErrorCode { get; init; }

    public static Result Ok() => new() { Success = true };
    public static Result Fail(string error, string? code = null) =>
        new() { Success = false, Error = error, ErrorCode = code };
}

public sealed class Result<T> : Result
{
    public T? Value { get; init; }

    public static Result<T> Ok(T value) => new() { Success = true, Value = value };
    public static new Result<T> Fail(string error, string? code = null) =>
        new() { Success = false, Error = error, ErrorCode = code };
}
