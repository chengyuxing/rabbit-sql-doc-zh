# 查询执行器

`Baki#query(sql)` 返回 `QueryExecutor`，负责绑定参数并选择结果类型。

## 绑定参数

```java
baki.query("select * from test.user where id = :id and name = :name")
    .arg("id", 10)
    .arg("name", "cyx")
    .rows();
```

也可以一次性覆盖参数：

```java
baki.query("...")
    .args(Args.of("id", 10, "name", "cyx"))
    .rows();

baki.query("...")
    .args("id", 10, "name", "cyx")
    .rows();
```

## 返回类型

### stream

返回惰性 `Stream<DataRow>`，适合二次处理，使用后必须关闭：

```java
try (Stream<DataRow> stream = baki.query("...").stream()) {
    stream.map(...).forEach(...);
}
```

### maps

返回 `List<Map<String, Object>>`：

```java
List<Map<String, Object>> maps = baki.query("...").maps();
```

### rows

返回 `List<DataRow>`：

```java
List<DataRow> rows = baki.query("...").rows();
```

### entities

返回实体集合，需要配置 `entityMetaProvider`：

```java
List<Guest> guests = baki.query("...").entities(Guest.class);
```

### findFirst

返回 `Optional<DataRow>`：

```java
Optional<DataRow> first = baki.query("...").findFirst();
```

### findFirstRow

返回第一条 `DataRow`，不会为 `null`：

```java
DataRow row = baki.query("...").findFirstRow();
```

### findFirstEntity

返回第一条实体，可能为 `null`：

```java
Guest guest = baki.query("...").findFirstEntity(Guest.class);
```

### pageable

转成分页查询：

```java
PagedResource<DataRow> page = baki.query("...")
    .pageable(1, 20)
    .collect();
```

详细分页配置见 [分页查询](documents/core-pagination)。

