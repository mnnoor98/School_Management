using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using SchoolManagement.Application.Common.Interfaces;

namespace SchoolManagement.Infrastructure.Services;

public class CampusCacheService : ICampusCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ICampusContext _campusContext;
    private static readonly ConcurrentDictionary<string, byte> _trackedKeys = new();

    public CampusCacheService(IMemoryCache memoryCache, ICampusContext campusContext)
    {
        _memoryCache = memoryCache;
        _campusContext = campusContext;
    }

    private string BuildCampusScopedKey(string key)
    {
        var schoolId = !string.IsNullOrEmpty(_campusContext.SchoolId) ? _campusContext.SchoolId : "global";
        var branchId = !string.IsNullOrEmpty(_campusContext.BranchId) ? _campusContext.BranchId : "all";
        return $"campus:{schoolId}:{branchId}:{key}";
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        var scopedKey = BuildCampusScopedKey(key);
        if (_memoryCache.TryGetValue(scopedKey, out T? cachedValue) && cachedValue != null)
        {
            return cachedValue;
        }

        var value = await factory();
        var cacheEntryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(15)
        };

        _memoryCache.Set(scopedKey, value, cacheEntryOptions);
        _trackedKeys.TryAdd(scopedKey, 0);

        return value;
    }

    public void Remove(string key)
    {
        var scopedKey = BuildCampusScopedKey(key);
        _memoryCache.Remove(scopedKey);
        _trackedKeys.TryRemove(scopedKey, out _);
    }

    public void RemoveByPrefix(string prefix)
    {
        var scopedPrefix = BuildCampusScopedKey(prefix);
        var keysToRemove = _trackedKeys.Keys
            .Where(k => k.StartsWith(scopedPrefix, StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var k in keysToRemove)
        {
            _memoryCache.Remove(k);
            _trackedKeys.TryRemove(k, out _);
        }
    }
}
