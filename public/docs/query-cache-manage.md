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
  if(Objects.equals(sql, '&my.dic')){
    return true;
  }
  return false;
}
```

