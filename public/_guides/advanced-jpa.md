# 实体兼容 JPA 等其他框架

从 Rabbit SQL `10.0.0` 起，框架移除了内置的 JPA 实体映射支持。

多个框架一起使用很常见，例如 JPA 和 Rabbit SQL 配合：单表操作交给 JPA，复杂查询交给 Rabbit SQL。但这样会带来两个问题：

1. 两个框架不同的实体解析逻辑；
2. 不同的实体注解；

为了避免混乱，从 Rabbit SQL `10.1.0` 和 Starter `5.1.1` 开始，框架提供 `com.github.chengyuxing.sql.EntityManager.EntityMetaProvider` 接口，用于兼容 JPA 或其他框架注解标注的实体，它同时也是框架内部实体映射的核心接口。

实体映射在 Rabbit SQL 中是辅助能力，主要为了兼容其他框架而存在，因此没有默认实现。下面以 JPA 为例，基于 Spring Boot 单数据源自动配置来说明如何适配 JPA 注解：

```java
@Component
public class JpaEntityMetaParser implements EntityManager.EntityMetaProvider {
  ...
}
```

实现表名解析方法时，需要处理的注解是 `@Entity` 和 `@Table`。按照 JPA 规范，大致实现如下：

```java
@Override
public String tableName(Class<?> clazz) {
    if (!clazz.isAnnotationPresent(Entity.class)) {
        throw new IllegalStateException(clazz.getName() + " must be annotated with @" + Entity.class.getSimpleName());
    }
    String tableName = clazz.getSimpleName().toLowerCase();
    if (clazz.isAnnotationPresent(Table.class)) {
        Table table = clazz.getAnnotation(Table.class);
        if (!table.name().isEmpty()) {
            tableName = table.name();
        }
        if (!table.schema().isEmpty()) {
            tableName = table.schema() + "." + tableName;
        }
    }
    return tableName;
}
```

针对单表操作，需要完成实体字段名与表列名的映射，以及根据 JPA 注解含义生成列约束。核心注解有 `@Id`、`@Column`、`@Transient`、`@GeneratedValue`。

`ColumnMeta` 中的几个属性分别对应：

- `@Column` 的 `insertable` 和 `updatable`，用于约束实体操作中的插入和更新；

- `@Id` 标记主键 `primaryKey`，是每个实体的强制约束；

- `@GeneratedValue` 搭配 `@Id` 使用，主键生成策略 `idGenerateStrategy` 支持 `IDENTITY`（数据库自增或序列默认值），决定插入语句是否包含主键列（**Rabbit SQL 10.3.12+，Starter 5.3.12+**）；

- `@Transient` 标记的字段按 JPA 语义应被忽略，对应列元数据属性 `ignore`。

Rabbit SQL 的核心接口方法 `Baki#entity()` 会根据这些规则来约束实体的操作：

```java
@Override
public EntityManager.ColumnMeta columnMeta(Field field) {
    EntityManager.ColumnMeta columnMeta = new EntityManager.ColumnMeta(field.getName());
    if (field.isAnnotationPresent(Column.class)) {
        Column column = field.getAnnotation(Column.class);
        if (!column.name().isEmpty()) {
            columnMeta.setName(column.name());
        }
        columnMeta.setInsertable(column.insertable());
        columnMeta.setUpdatable(column.updatable());
    }
    columnMeta.setPrimaryKey(field.isAnnotationPresent(Id.class));
    if (field.isAnnotationPresent(GeneratedValue.class)) {
        GeneratedValue generatedValue = field.getAnnotation(GeneratedValue.class);
        if (generatedValue.strategy() == GenerationType.IDENTITY) {
            columnMeta.setIdGenerateStrategy(EntityManager.IdGenerateStrategy.IDENTITY);
        }
    }
    columnMeta.setIgnore(field.isAnnotationPresent(Transient.class));
    return columnMeta;
}
```

实现以上方法后，基本就完成了 JPA 单表兼容。无论使用 JPA 的单表操作，还是 Baki 的单表操作，都能获得一致的逻辑。其他框架也可以按类似方式实现。

还有一个数据库查询数据列映射为实体字段类型的值转换方法简单实现：

```java
@Override
public Object columnValue(Field field, Object value) {
    return ValueUtils.adaptValue(field.getType(), value);
}
```

实现这个接口后，框架内部所有数据库操作中的实体字段映射和值转换都会统一通过它完成；但列约束只在 `Baki#entity()` 中生效。
