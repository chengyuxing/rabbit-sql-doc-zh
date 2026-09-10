# 实体操作与 DSL 查询

Rabbit SQL 支持简单的单表实体操作，通过 `Baki#entity(Class)` 使用。

## 准备实体元数据

实现 `com.github.chengyuxing.sql.EntityManager.EntityMetaProvider`，并配置到 `BakiDao#entityMetaProvider`。

核心方法是：

- `tableName(Class<?> clazz)`：解析表名。
- `columnMeta(Field field)`：解析列约束。
- `columnValue(Field field, Object value)`：转换数据库值。

详细适配 JPA 注解的示例见 [实体兼容 JPA 等其他框架](guides/advanced-jpa)。

## 查询

```java
List<Guest> guests = baki.entity(Guest.class)
    .query()
    .where(w -> w.gt(Guest::getId, 5)
                 .and(o -> o.in(Guest::getId, List.of(17, 18, 19))
                            .eq(Guest::getId, 10)))
    .orderBy(o -> o.desc(Guest::getId))
    .list();
```

可用的查询终态方法：

- `stream()`
- `list()`
- `top(n)`
- `findFirst()`
- `pageable(page, size)`
- `count()`
- `forEach(consumer)`

## 插入

```java
baki.entity(Guest.class)
    .insert()
    .save(guest);
```

批量插入：

```java
baki.entity(Guest.class)
    .insert()
    .save(guests);
```

默认会忽略 `null` 字段。如需保留 `null` 并走 JDBC 批量执行：

```java
baki.entity(Guest.class)
    .insert()
    .withNullValues()
    .save(guests);
```

## 更新

按主键更新：

```java
baki.entity(Guest.class)
    .update()
    .save(guest);
```

按条件更新部分字段：

```java
baki.entity(Guest.class)
    .update()
    .where(w -> w.eq(Guest::getId, 10))
    .set(Guest::getAddress, "Kunming")
    .save();
```

## 删除

```java
baki.entity(Guest.class)
    .delete()
    .execute(guest);
```

按条件删除：

```java
baki.entity(Guest.class)
    .delete()
    .where(w -> w.lt(Guest::getId, 5))
    .execute();
```

## 条件构建器

默认所有条件以 `and` 连接；使用 `and(...)` / `or(...)` 可以构建嵌套逻辑。

- `and()`：内部条件以 `or` 连接。
- `or()`：内部条件以 `and` 连接。

