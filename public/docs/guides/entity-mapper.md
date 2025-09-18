# 实体映射扩展

在 Rabbit SQL `10.0.0` 以后，已移除了内置对 JPA 实体的映射支持。

本框架为了做到最纯粹的执行 SQL ，内部将不再硬编码实体映射逻辑，以到达与各种框架做到最大的兼容性。

实体映射核心为 `DataRow` 类，其提供了方法 `toEntity` 和 `ofEntity` ，如果有特殊实体映射需求，通过配置属性 `BakiDao#entityFieldMapper` 来实现自定义解析。

## 字段名映射

例如 JPA 的标准实体有注解 `@Column` ，那么简单的映射实现如下：

```java
class MyEntityFieldMapper implements EntityFieldMapper {
    @Override
    public String apply(Field field) {
        if (field.isAnnotationPresent(Column.class)) {
            Column column = field.getAnnotation(Column.class);
            return column.name();
        }
        return field.getName();
    }
}
```

通过实现此接口，即可在 springboot 框架中，Rabbit SQL 和 JPA 互相兼容，具有相同的实体映射逻辑，其他框架也基本如此。

## 字段值映射

``BakiDao#entityValueMapper``

通过实现接口 `EntityValueMapper` 来实现自定义的值映射转换，框架内部默认为 `null` ，表示其用内置的实现，具体参考：

```java
ObjectUtil.mapToEntity(this, clazz, fieldMapper, valueMapper, constructorParameters)
```

配置了自定义的值解析，则将不再使用内置实现。