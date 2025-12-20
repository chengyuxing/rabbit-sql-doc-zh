# 实体兼容 JPA 等其他框架

在 Rabbit SQL `10.0.0` 以后，已移除了内置对 JPA 实体的映射支持。

通常来说，多个框架在一起使用是很常见的行为，比如 JPA 和 Rabbit SQL 配合使用，单表操作使用 JPA，复杂查询交给 Rabbit SQL，Rabbit SQL也支持简单的实体，那现在就遇到了几个问题：

1. 两个框架不同的实体解析逻辑；
2. 不同的实体注解；

所以为了避免上述问题造成混乱，从 Rabbit SQL (10.1.0) 和 Starter (5.1.1) 开始，提供了接口：`com.github.chengyuxing.sql.EntityManager.EntityMetaProvider` 来兼容 JPA 或其他框架注解标注的实体，同时也是框架内部数据实体映射的核心接口。

实体支持作为框架内部的二等公民，主要为了兼容其他框架而存在，所以并没有默认实现，我们就以 JPA 为例，来自行适配 JPA 注解规则，还是基于 Springboot 单数据源自动配置来快速进行配置：

```java
@Component
public class JpaEntityMetaParser implements EntityManager.EntityMetaProvider {
  ...
}
```

实现获取表名的方法，实体类上需要解析的注解为 `@Entity` 和 `@Table` ，按照 JPA 规范的实现过程大致如下：

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

基于单表对实体字段名和表列名的映射解析，以及 JPA 注解属性含义对列的约束逻辑，其核心注解有： `@Id` ， `@Column` ， `@Transient` 。

`ColumnMeta` 中的几个属性分别对应了 `@Column` 的属性 `insertable` 和 `updatable` 作为约束实体操作的插入和更新，`@Id` 作为标记主键对每个实体的强制约束，`@Transient` 标记的列根据 JPA 的含义应被忽略，对应列元数据属性 `ignore` ，Rabbit SQL 的核心接口方法 `Baki#entity()` 会根据这些规则来约束实体的操作：

```java
@Override
public EntityManager.ColumnMeta columnMeta(Field field) {
    EntityManager.ColumnMeta columnMeta = new EntityManager.ColumnMeta(field.getName());
    if (field.isAnnotationPresent(Column.class)) {
        Column column = field.getAnnotation(Column.class);
        columnMeta.setName(column.name());
        columnMeta.setInsertable(column.insertable());
        columnMeta.setUpdatable(column.updatable());
    }
    columnMeta.setPrimaryKey(field.isAnnotationPresent(Id.class));
    columnMeta.setIgnore(field.isAnnotationPresent(Transient.class));
    return columnMeta;
}
```

通过实现以上方法就基本达到了对 JPA 单表的兼容，无论使用 JPA 的单表操作还是 Baki 的单表操作，都能获得相同的逻辑，即使是其他框架，大致都是同样的实现逻辑。

还有一个数据库查询数据列映射为实体字段类型的值转换方法简单实现：

```java
@Override
public Object columnValue(Field field, Object value) {
    return ObjectUtil.convertValue(field.getType(), value);
}
```

以上，通过实现这个接口，整个框架内部所有操作数据库的接口方法的实体字段映射和值转换都根据此接口来进行统一调度，但列的约束只在接口 `Baki#entity()` 中生效。
