# 数据源与 DatabaseInfo

## DatabaseInfo

Rabbit SQL 通过 `DatabaseInfo` 识别当前数据库：

```java
DatabaseInfo info = baki.databaseInfo();
String dbName = info.getName();
String version = info.getVersion();
```

动态 SQL 中也可以访问：

```sql
-- #if :_databaseId.name == 'postgresql'
  ...
-- #fi
```

## DatabaseInfoProvider

当使用动态数据源时，默认的 `databaseInfo()` 可能无法返回准确结果。实现 `DatabaseInfoProvider` 并注册为 Bean，可以实时解析当前数据源：

```java
@Component
public class DynamicDatabaseInfoProvider implements DatabaseInfoProvider {
    private final Map<String, DatabaseInfo> cache = new ConcurrentHashMap<>();

    @Override
    public DatabaseInfo resolve(DataSource dataSource, Supplier<DatabaseInfo> supplier) {
        if (dataSource instanceof DynamicDataSource dynamicDataSource) {
            String key = DynamicDataSourceContextHolder.peek();
            return cache.computeIfAbsent(key, k -> supplier.get());
        }
        return null;
    }
}
```

详细说明见 [整合动态数据源](guides/advanced-dynamic-datasource)。

## 多 Baki 实例

Spring 容器中存在多个 `Baki` 实例时，XQL 接口映射可以使用 `@Baki` 指定底层依赖：

```java
@Baki("slaveBaki")
@XQLMapper("slave")
public interface SlaveMapper {
}
```

