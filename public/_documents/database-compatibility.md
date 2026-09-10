# 数据库兼容性

Rabbit SQL 通过 JDBC 访问数据库，并尽量保持 SQL 原生语义。不同数据库之间主要需要关注分页、命名参数前缀和存储过程写法。

## DatabaseInfo

框架运行时通过 `DatabaseInfo` 描述当前数据库信息：

```java
DatabaseInfo info = baki.databaseInfo();

info.getName();    // 数据库产品名，例如 postgresql
info.getVersion(); // 数据库版本
info.getDriver();  // JDBC 驱动名
info.getJdbcUrl();
```

在动态 SQL 中也可以通过内置变量访问：

```sql
-- #if :_databaseId.name == 'postgresql'
  ...
-- #fi
```

## 内置分页支持

内置分页实现覆盖：

- Oracle
- MySQL
- PostgreSQL
- SQLite
- MariaDB
- DB2
- SQL Server 2012+

其他数据库可以通过 `PageHelperProvider` 扩展，例如人大金仓可以复用 PostgreSQL 分页，达梦可以复用 Oracle 分页。

## 命名参数前缀

默认命名参数前缀是 `:`。部分数据库的语法会与 `:` 冲突，例如 Neo4j 中 `:` 表示类型。此时可以在 `xql-file-manager.yml` 中修改：

```yaml
named-param-prefix: '$'
```

之后 SQL 中使用 `$id` 作为命名参数。

## 动态数据源

当项目使用动态数据源时，需要让框架能获取当前数据源的 `DatabaseInfo`。具体实现见 [整合动态数据源](guides/advanced-dynamic-datasource)。

