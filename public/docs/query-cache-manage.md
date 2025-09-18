# 查询缓存管理

Baki 支持配置查询缓存实现，配置满足需求的缓存中间件（ Redis，内存数据库等）可以在及时性不高的 SQL 查询，例如按时间段的统计查询，字典表，配置表等。

默认的缓存 key 实现为：

```java
default @NotNull String uniqueKey(@NotNull String sql, Map<String, Object> args) {
        String argsStr = Objects.nonNull(args) ? "@" + StringUtil.hash(args.toString(), "MD5") : "";
        if (sql.startsWith("&")) {
            return sql + argsStr;
        }
        return StringUtil.hash(sql, "MD5") + argsStr;
    }
```

可以更具具体需求来重写此方法，需要特别注意，分页查询一般不应该缓存，并且参数也有必要作为 key 的一部分，以降低缓存重复率过高导致不准确的问题。

## 获取缓存

实现 `get` 方法来返回缓存结果，需要转为一个 Stream 对象，如果缓存不存在，不要返回空集合对象，必须返回 `null` 才能真正触发执行 SQL 再次进行查询数据库。

## 设置缓存

实现 `put` 方法来设置缓存，缓存最好有一个失效时间，如果使用 Redis ，可以使用 `expire` 来为此缓存配置一个过期时间，保证数据缓存合理的进行更新。

## 激活缓存

通过实现 `isAvailable` 方法来确认需要缓存哪些 SQL，如果在 Baki 配置了 XQL 文件管理器的情况下，可根据 SQL 名判断具体需要缓存哪些 SQL。 

```java
@Override
boolean isAvailable(@NotNull String sql, Map<String, Object> args){
  if(Objects.equals(sql, "&my.dic")){
    return true;
  }
  return false;
}
```

一般来说，推荐缓存的查询类型为**统计**或**不进行分页的查询**，若要对默认的分页构建查询缓存，此时并不能获取到 SQL 的名字，因为使用了内建的分页查询包裹，XQL 文件管理器中并没有这条 SQL，但也不是没办法。

此方法除了判断 SQL 名之外，还提供了执行此条 SQL 所传入的参数，那么针对参数做一点操作同样也能满足需求，还能获得更多的灵活性，例如：

```java
@Override
boolean isAvailable(@NotNull String sql, Map<String, Object> args){
  if(args.contains("enableCache")){
    return true;
  }
  return false;
}
```

如果参数包含键 `enableCache` 同样也激活缓存。

> ⚠️ 缓存的启用请务必设置相应的缓存过期策略，特别是及时性需求较高的查询，以免产生误差。

## 思路

除了被动式的缓存之外，还可以实现主动缓存，通过计划任务，定时执行相应的 SQL，将缓存提前存储和更新，在项目上线后，可以一定程度的缓解并发查询压力。

由于获取缓存的方法返回 `Stream` ，所以这里还能对对缓存结果在进行一定的过滤处理，比如用在时间范围查询中，在大范围的缓存中查询小范围的数据，也能避免再次查询数据库：

```java
@Override
public Stream<DataRow> get(String key) {
   ...
}
```

最后，缓存虽好，但需要在数据及时性、精确性和数据库压力这几方面进行取舍，达到一个最佳的平衡点，这才是一个设计良好的缓存策略。
