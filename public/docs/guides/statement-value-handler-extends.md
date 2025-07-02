# 扩展预编译 SQL 值处理器

Rabbit SQL 默认支持的值类型都比较少，在不同的框架中还有其特有的值类型，每次都手动处理转换比较麻烦，通过实现接口 `com.github.chengyuxing.sql.plugins.StatementValueHandler` 来轻松扩展：

```java
public class MyStatementValueHandler implements StatementValueHandler {
    @Override
    public void handle(@NotNull PreparedStatement ps, @Range(from = 1, to = Integer.MAX_VALUE) int index, @Nullable Object value, @NotNull DatabaseMetaData metaData) throws SQLException {
      // ...
      // 这是一个内部实现作为兜底的方法，除非完全自己实现
      JdbcUtil.setStatementValue(ps, index, value);
    }
}
```

处理 Spring boot **MultipartFile** ，甚至于如果您有文件服务器或其他存储文件中间件的话，可以截获处理所有文件类型，将文件存储到文件服务器，数据库仅存储文件路径即可：

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

如果传入的值类型为 **Map** 或 **List** ，在大多数数据库中并没有与之对应的数据类型，那么默认情况下可序列化为 **JSON** 较为合理：

```java
if (value instanceof Map<?, ?> || value instanceof List<?>) {
   ps.setString(index, Jackson.toJson(value));
   return;
}
```

还可以根据不同的数据库来针对性的处理值：

```java
if(metaData.getDatabaseProductName().equalsIgnoreCase("postgresql")){
  // ...
}
```

在信创中，面对随时更换五花八门的国产数据库，此方法显得尤为重要！