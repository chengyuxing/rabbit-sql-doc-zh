# BakiDao 低级执行方法

`BakiDao` 是 `Baki` 的默认实现。除了 `Baki` 接口中的方法，它还提供了一批更接近 JDBC 的低级执行方法，适合需要精确控制 SQL 执行方式的场景。

## executeAny

执行任意 SQL，并根据结果类型返回 `DataRow`。

```java
DataRow result = bakiDao.executeAny("select * from test.user where id = :id", Args.of("id", 10));
```

## executeQueryStream

执行查询并返回惰性 `Stream<DataRow>`，使用后必须关闭。

```java
try (Stream<DataRow> stream = bakiDao.executeQueryStream("select * from test.user", null)) {
    stream.forEach(System.out::println);
}
```

## executeUpdate

执行 DML，返回受影响行数。

```java
int affected = bakiDao.executeUpdate("update test.user set name = :name where id = :id",
    Args.of("name", "cyx", "id", 10));
```

## executeBatchUpdate

批量执行同一条预编译 DML。

```java
List<Map<String, Object>> args = List.of(
    Args.of("id", 1, "name", "a"),
    Args.of("id", 2, "name", "b")
);

BatchResult result = bakiDao.executeBatchUpdate(
    "update test.user set name = :name where id = :id",
    args,
    Function.identity(),
    bakiDao.getBatchSize()
);
```

也可以通过 `Baki#execute(sql, Iterable)` 使用默认批量大小。

## executeCallStatement

执行存储过程或函数。

```java
DataRow result = bakiDao.executeCallStatement("{:res = call test.sum(:a, :b)}",
    Args.of("res", Param.OUT(StandardOutParamType.INTEGER))
        .add("a", Param.IN(34))
        .add("b", Param.IN(56)));
```

## executeBatch

批量执行一组非预编译 SQL。

```java
List<String> sqlList = List.of(
    "create table a(id int)",
    "create table b(id int)"
);

BatchResult result = bakiDao.executeBatch(sqlList, 100);
```

## using(Connection)

获取一个连接执行自定义逻辑，执行后自动释放连接。

```java
String version = bakiDao.using(connection -> {
    try (Statement statement = connection.createStatement();
         ResultSet rs = statement.executeQuery("select version()")) {
        return rs.next() ? rs.getString(1) : null;
    } catch (SQLException e) {
        throw new UncheckedIOException(e);
    }
});
```

## identifier

`Baki#identifier` 是一个参数键，用于把查询标识传入参数，方便在拦截器、缓存或日志中区分业务查询。

```java
String queryId = (String) args.get(Baki.IDENTIFIER);
```

在实体查询中，`query(queryId)` 会把查询 ID 写入参数：

```java
baki.entity(Guest.class)
    .query("guest:list")
    .list();
```


实体查询的 `query(queryId)` 是业务查询标识，不会按主键过滤。查询某个主键对应的实体使用 `baki.entity(Guest.class).findById(id)`，返回 `Optional<Guest>`，详见 [实体操作](documents/core-entity)。
