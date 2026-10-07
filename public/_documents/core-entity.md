# 实体操作与 DSL 查询

Rabbit SQL 支持简单的单表实体操作，通过 `Baki#entity(Class)` 使用。

## 准备实体元数据

默认 `EntityMetaProvider` 使用类的简单名作为表名、字段名作为列名，并适配查询结果值的类型。它不识别 JPA 注解，也不会自动指定主键。单表 CRUD 需要实现 `com.github.chengyuxing.sql.EntityManager.EntityMetaProvider`，配置到 `BakiDao#entityMetaProvider`，并明确标记一个主键。

核心方法是：

- `tableName(Class<?> clazz)`：解析表名。
- `columnMeta(Field field)`：解析列约束。
- `columnValue(Field field, Object value)`：转换数据库值。

详细适配 JPA 注解的示例见 [实体兼容 JPA 等其他框架](guides/advanced-jpa)。

实体属性通过 JavaBean getter/setter 与对应字段识别。字段沿继承链查找，子类同名字段优先；子类重写 getter 时仍能找到父类字段及其注解。布尔 getter 可使用 `Guest::isActive`。没有对应字段的计算属性不参与映射，仅声明字段而没有 JavaBean 访问方法的实体不会自动映射。

实体 CRUD 要求恰好一个主键，不支持复合主键。空表名、空列名和重复映射列名会在元数据初始化时被拒绝。只有主键或没有可更新列的实体可以查询、插入、删除，更新操作会报错。

建议在首次使用前完成提供者配置。更换 `EntityMetaProvider` 会清除缓存，但已经取得的实体执行器仍持有原元数据，需要重新调用 `baki.entity(...)` 获取。

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

`NONE`（手动主键）策略要求在所有插入入口显式提供非空主键；`IDENTITY` 策略由数据库生成主键，插入时不包含主键列。框架不会自动把生成的主键回填到实体。仅有 `IDENTITY` 主键的实体生成 `insert ... default values`，使用前请确认数据库支持该语法。

默认会忽略 `null` 字段。如需保留 `null` 并走 JDBC 批量执行：

```java
baki.entity(Guest.class)
    .insert()
    .withNullValues()
    .save(guests);
```

插入时通过 `.set(...)` 指定字段，同一字段最后一次赋值生效，`save()` 不会重新覆盖为初始值。

## 更新

按主键更新要求实体主键非空，单个实体及集合入口均会校验：

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

空分组会被递归跳过，不产生多余的 `and` / `or`。如果所有条件均被跳过，按条件更新和删除仍会拒绝执行，空分组不能替代有效的 `where` 条件。
