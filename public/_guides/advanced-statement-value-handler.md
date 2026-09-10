# 扩展预编译 SQL 值处理器

Rabbit SQL 默认内置支持的值类型有限，而不同框架还会有各自的特殊值类型。如果每次都手动转换会比较麻烦，可以通过实现接口 `com.github.chengyuxing.sql.plugins.StatementValueHandler` 并[配置到 BakiDao](documents/core-api-config#md-head-4) 来扩展：

```java
public class MyStatementValueHandler implements StatementValueHandler {
    @Override
    public void handle(@NotNull PreparedStatement ps, @Range(from = 1, to = Integer.MAX_VALUE) int index, @Nullable Object value, @NotNull DatabaseInfo info) throws SQLException {
      // ...
      // 这是内部兜底实现，除非你完全自己处理参数，否则建议调用它
      JdbcUtil.setStatementValue(ps, index, value);
    }
}
```

例如处理 Spring Boot 的 **MultipartFile**。如果还有文件服务器或其他文件存储中间件，可以拦截所有文件类型，把文件保存到文件服务器，数据库只保存文件路径：

```java
if (value instanceof MultipartFile) {
   try {
        ps.setBinaryStream(index, ((MultipartFile) value).getInputStream());
        return;
    } catch (IOException e) {
        throw new UncheckedIOException(e);
    }
}
```

如果传入值是 **Map** 或 **List**，大多数数据库没有对应的原生类型，此时默认序列化为 **JSON** 比较合理：

```java
if (value instanceof Map<?, ?> || value instanceof List<?>) {
   ps.setString(index, Jackson.toJson(value));
   return;
}
```

还可以根据不同的数据库来针对性的处理值：

```java
if(info.getName().equals("postgresql")){
  // ...
}
```

在信创场景中，需要面对随时更换、种类繁多的国产数据库，这个扩展点会显得尤为重要。
