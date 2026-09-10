# 故障排查

## 惰性查询导致连接池耗尽

`stream()` 返回的 `Stream` 内部持有 JDBC `Connection`，使用后必须关闭。

```java
try (Stream<DataRow> stream = baki.query("...").stream()) {
    // 处理结果
}
```

## Spring 环境内置事务不生效

Spring Boot 中使用 Starter 后，请使用 Spring 事务或 `com.github.chengyuxing.sql.spring.autoconfigure.Tx`。

不要使用 `com.github.chengyuxing.sql.transaction.Tx`。

## 动态 SQL 解析报错

检查指令是否独立成行、`#if` / `#fi` 是否成对、`#for` / `#done` 是否成对，以及管道名是否已注册。

## XQL 文件分号解析异常

每个 SQL 对象以单个 `;` 分隔。如果存储过程或 PLSQL 内部包含多个 `;`，请在需要保留的分号后追加行注释 `--`：

```sql
begin;
  select 1; --
  select 2; --
end;
```

## IDEA 插件无法识别项目

确认是标准 Maven 项目，且存在 `src/main/resources` 目录。非 Maven 项目需要手动创建该目录。

## 多数据源注入冲突

如果存在多个 `Baki` 实例，接口映射时可以使用 `@Baki("beanName")` 指定使用哪个实例。

## 分页 SQL 不符合预期

确认当前数据库是否有内置分页实现。没有时，通过 `globalPageHelperProvider` 或单条查询的 `pageHelper(...)` 提供自定义实现。

