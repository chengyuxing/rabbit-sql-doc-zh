# 实现一个基于 Redis 的缓存管理器

我们实现一个简易版缓存管理器：软过期 + 硬过期 + 双重检测。

核心是实现接口 `com.github.chengyuxing.sql.plugins.QueryCacheManager`。

配置到 `BakiDao` 后，`BakiDao` 中的查询接口即可无感使用查询缓存，业务代码无需任何改动。

为了方便，这里使用 Spring Boot 项目进行配置，首先在 Maven 中引入依赖：

- `rabbit-sql-spring-boot-starter` （5.0.9+）
- `spring-boot-starter-data-redis`

这里使用默认的单数据源自动配置。

```java
@Component
public class RedisCacheManager implements QueryCacheManager {
  ...
}
```

创建一个缓存对象类，也是序列化到 redis 的数据结构：

```java
public static class CacheEntry implements Serializable {
    private static final long serialVersionUID = 1L;
    public List<DataRow> value;
    public long softExpireAt;
    public long hardExpireAt;
}
```

依赖注入 `RedisTemplate<Object, Object> redisTemplate;`

## 构建缓存 Key

既然要进行缓存，首先要考虑缓存 key 的生成。

为了保证缓存命中率，key 的生成应尽可能唯一。下面是一个小例子，通过 SQL 和参数进行 MD5 处理：

```java
@NotNull String uniqueKey(@NotNull String sql, Map<String, ?> args) {
    String argsStr = "";
    if (args != null && !args.isEmpty()) {
        StringBuilder sb = new StringBuilder();
        args.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(e -> {
                    sb.append(e.getKey()).append("=").append(e.getValue());
                });
        argsStr = "@" + StringUtil.hash(sb.toString(), "MD5");
    }
    if (sql.startsWith("&")) {
        return sql + argsStr;
    }
    return StringUtil.hash(sql, "MD5") + argsStr;
}
```

> 这里假设 Map 参数值都是基本类型，没有嵌套 Map 或 Set 等其他类型，否则，需要考虑的更加全面，避免缓存击穿。

## 异步刷新

最关键的一步是异步刷新。缓存过期时，为了合理更新缓存且不阻塞主线程，需要使用异步方式更新。需要满足：

- 非阻塞；
- 数据更新及时；
- 多线程访问时避免缓存击穿；

```java
private final ExecutorService refreshPool = Executors.newSingleThreadExecutor(r -> {
    Thread thread = new Thread(r, "Rabbit-SQL Refresh Thread");
    thread.setDaemon(true);
    return thread;
});

void asyncRefresh(@NotNull String sql, Map<String, ?> args, @NotNull RawQueryProvider provider) {
    String key = uniqueKey(sql, args);
    String lockKey = "lock:" + key;
    // 这里设置一个锁的过期时间，避免长时间占用，导致其他线程获取不到数据
    Boolean ok = redisTemplate.opsForValue().setIfAbsent(lockKey, 1, 30, TimeUnit.SECONDS);
    if (ok == null || !ok) {
        return;
    }
    refreshPool.execute(() -> {
        // 双重检测，避免击穿
        CacheEntry entry = (CacheEntry) redisTemplate.opsForValue().get(key);
        // 如果缓存还没有软过期，那就取消查库刷新
        if (entry != null && System.currentTimeMillis() < entry.softExpireAt) {
            return;
        }
        try (Stream<DataRow> s = provider.query()) {
            List<DataRow> result = s.collect(Collectors.toList());
            saveEntry(key, result);
        } finally {
          	// 释放锁
            redisTemplate.delete(lockKey);
        }
    });
}
```

## 重写核心接口

本示例缓存策略的具体逻辑为：

1. 第一次请求或缓存已硬过期，直接通过流式查询数据库，并在关闭时将结果写进缓存；
2. 如果请求缓存存在并且没有软过期，直接返回缓存；
3. 如果缓存超过软过期，执行**异步刷新**缓存，并返回缓存数据；

```java
@Override
public @NotNull Stream<DataRow> get(@NotNull String sql, Map<String, ?> args, @NotNull RawQueryProvider provider) {
    String key = uniqueKey(sql, args);
    long now = System.currentTimeMillis();
    CacheEntry entry = (CacheEntry) redisTemplate.opsForValue().get(key);
    if (entry == null || now >= entry.hardExpireAt) {
        List<DataRow> result = new ArrayList<>();
        return provider.query()
                .peek(result::add)
                .onClose(() -> saveEntry(key, result));
    }
    if (now < entry.softExpireAt) {
        return entry.value.stream();
    }
    asyncRefresh(sql, args, provider);
    return entry.value.stream();
}
```

> 整个过程使用异步刷新机制，避免使用同步块导致阻塞。

软/硬过期时间最好再加上一个约 10-50ms 的随机数，避免某些情况下缓存同时过期。硬过期时间写入 Redis 的缓存过期时间：

```java
void saveEntry(@NotNull String key, List<DataRow> value) {
    long now = System.currentTimeMillis();
    CacheEntry entry = new CacheEntry();
    entry.value = value;
    entry.softExpireAt = now + 5000;
    entry.hardExpireAt = now + 60000;
    redisTemplate.opsForValue().set(key, entry, 60000, TimeUnit.MILLISECONDS);
}
```

## 激活缓存

如果只想对满足条件的 SQL 启用缓存，可以根据 SQL 名字或参数中的某个键值来过滤，通过实现 `isAvailable` 方法完成：

```java
@Override
public boolean isAvailable(@NotNull String sql, Map<String, ?> args) {
  	if(ALLOWS.containsKey(sql)){
      return true;
    }
    return false;
}
```

最后，一个强大且高性能的缓存管理器肯定不止这些内容。
