# 性能、安全与部署

## 性能优化

### 惰性查询

如果对查询结果需要进行二次处理转换等操作，推荐返回类型为 **Stream**，减少循环的次数，提升性能。

### 批量操作

对于批量插入、更新等操作，推荐使用批量提交，减少数据库的网络交互次数，提升性能。

```java
baki.execute("&guest.insert", rows);
```

> 预编译批处理可向 `baki.execute(sql, rows)` 传入 `Iterable`；`table(...).enableBatch()` 的插入、更新也使用 JDBC 批处理。输入仅遍历一次，参数映射函数每行调用一次，单表批量插入、更新接受空输入。

每行动态 SQL 和参数都会重新解析，包括 `#for` 生成的参数。所有行最终生成的预编译 SQL 必须相同；如果 `#if` 改变列集合、`#for` 改变占位符数量等导致 SQL 结构变化，会明确报错。应先按 SQL 结构分组，或逐条执行。

`batchSize` 必须大于 `0`，只控制每次 JDBC 执行的条数。前面的分批可能已经执行，后面的错误本身不会撤销它们；要求整批原子性时，请使用 [事务](documents/core-transaction)。

### 缓存重复查询

针对频繁执行的相同查询，推荐使用应用层缓存或数据库查询缓存，减少重复 SQL 请求，提升系统响应速度。

实现接口：`com.github.chengyuxing.sql.plugins.QueryCacheManager` 来实现自定义的缓存层，并注册到 `BakiDao#setQueryCacheManager` 来启用缓存。

### SQL 优化

- 在 `.xql` 文件中，尽量使用索引字段进行查询，避免全表扫描。
- 定期检查数据库的执行计划，优化慢查询。

## 错误处理与调试

### 错误日志

- 确保所有 SQL 执行都被记录到日志中，尤其是异常发生时，方便排查问题。
- 使用 [rabbit-sql 插件][versions]进行[动态SQL](documents/xql-dynamic-sql)测试和调试，及时发现潜在问题。

### 常见错误处理

- **SQL 语法错误**：在 `.xql` 文件中书写 SQL 时，确保 SQL 语法正确，尤其是在[使用动态 SQL](documents/xql-dynamic-sql)时。

- **参数映射问题**：使用 [:参数名](documents/core-sql-params) 时，确保传递的参数名与 SQL 中的占位符匹配，避免 SQL 语句的参数未正确绑定。

- **连接释放问题**：使用 **Stream** 作为返回类型时，需要在使用完毕后进行释放，一般使用 `try-with-resource` 来进行释放连接：

  ```java
  try (Stream<DataRow> s = baki.query("&example.queryAllUsers").stream()) {
      List<DataRow> rows = s.collect(Collectors.toList());
  }
  ```


## 安全性最佳实践

### 防止 SQL 注入

- 使用[参数化查询](documents/core-sql-params)，确保所有的参数都通过 `:参数名` 占位符进行传递，避免 SQL 注入漏洞。
- 禁止在 SQL 中直接拼接用户输入，所有用户输入都应该通过参数占位符传递。

### 数据库连接池配置

- 配置合理的数据库连接池，避免数据库连接过多或连接泄漏，影响系统的可用性。

- 使用 Spring Boot 的连接池配置，设置合理的最小和最大连接数。

  ```yaml
  spring:
    datasource:
      hikari:
        minimum-idle: 5
        maximum-pool-size: 20
        connection-timeout: 30000
        idle-timeout: 600000
        max-lifetime: 1800000
  ```

## 版本控制与部署

- **定期更新依赖**：确保 rabbit-sql 的依赖库和插件保持最新版本，定期检查是否有安全漏洞或功能增强。
- **自动化测试**：对使用 rabbit-sql 的业务逻辑编写单元测试和集成测试，确保数据库操作的正确性和系统稳定性。

## 结语

**rabbit-sql** 是一个强大而灵活的持久层框架，通过遵循以上最佳实践，可以确保您的项目具有高效、可维护、性能优越的数据库交互逻辑。随时保持对最新功能和优化的关注，并根据项目需求灵活应用这些实践。

[versions]:https://plugins.jetbrains.com/plugin/21403-rabbit-sql/versions
[plugin]:https://plugins.jetbrains.com/plugin/21403-rabbit-sql
