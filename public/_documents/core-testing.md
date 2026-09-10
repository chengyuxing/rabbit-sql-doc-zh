# 动态 SQL 测试

动态 SQL 建议在开发阶段就进行验证，而不是等到上线后排查。

## IDEA 插件测试

安装 Rabbit SQL 插件后，可以直接在 XQL 文件或 Java 代码中执行动态 SQL：

- 在 XQL 文件 SQL 名上使用 <kbd>Alt</kbd> + <kbd>Enter</kbd>
- 在 Java 字符串 `&alias.sqlName` 上使用 <kbd>Alt</kbd> + <kbd>Enter</kbd>
- 在 XQL File Manager 工具窗口右键 SQL 片段

插件会自动识别参数，未配置数据源时只做解析验证，配置数据源后可真实执行。

## 纯 Java 测试

也可以不启动 Spring，直接创建 `BakiDao` 测试：

```java
HikariDataSource dataSource = new HikariDataSource();
dataSource.setJdbcUrl("jdbc:postgresql://127.0.0.1:5432/postgres");
dataSource.setUsername("postgres");

BakiDao baki = new BakiDao(dataSource);
baki.setXqlFileManager(new XQLFileManager("xql-file-manager.yml"));

List<DataRow> rows = baki.query("&example.queryUsers")
    .arg("id", 10)
    .rows();
```

对于 DML / DDL 测试，注意回滚或使用测试数据库，避免污染真实数据。

