# JPA

通过 `Baki#entity()` 来调用一些简单的实体操作。

已实现的JPA注解包括：`@Entity` ， `@Table` ， `@Id` ， `@Column` ， `@Transient` ，支持 Lambda 风格的 CRUD 操作，CRUD 逻辑基本遵循 JPA 规范即可。

一个简单的实体如下：

```java
@Entity
@Table(schema = "test")
public class Guest {
    @Id
    @Column(insertable = false, updatable = false)
    private Integer id;
    private String name;
    private Integer age;
    private String address;

    @Transient
    @Column(name = "count_all")
    private Integer count;
  
    // getter, setter
}
```

## 查询

查询支持构建形如：

```sql
select ... from table [where ...] [group by ...] [having ...] [order by ...]
```

一个复杂的例子如下：

```java
baki.query(Guest.class)
    .where(w -> w.isNotNull(Guest::getId)
        .gt(Guest::getId, 1)
        .and(a -> a.in(Guest::getId, Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8))
                .startsWith(Guest::getName, "cyx")
                .or(s -> s.between(Guest::getAge, 1, 100)
                        .notBetween(Guest::getAge, 100, 1000)
                   )
                .in(Guest::getName, Arrays.asList("cyx", "jack"))
        )
        .of(Guest::getAddress, () -> "~", "kunming")
    )
   .groupBy(g -> g.count()
       .max(Guest::getAge)
       .avg(Guest::getAge)
       .by(Guest::getAge)
       .having(h -> h.count(StandardOperator.GT, 1))
    )
   .orderBy(o -> o.asc(Guest::getAge))
   .toList()
```

通过配置操作符白名单 `BakiDao#operatorWhiteList` 可以支持非内建的自定义操作符：

```java
.of(Guest::getAddress, () -> "~", "kunming")
```

**查询**可构建复杂的 **where** 嵌套条件，分组 **having** 逻辑同 **where** 一样，支持展平风格和嵌套风格，其最终构建的 SQL 都一样，默认情况下多个条件以 ` and`  连接。

SQL：

```sql
where id > 5 and id < 10 or id in (17, 18, 19)
```

展平写法：

```java
.where(w -> w.gt(Guest::getId, 5))
.where(w-> w.lt(Guest::getId, 10))
.where(w -> w.or(o -> o.in(Guest::getId, Arrays.asList(17, 18, 19))))
```

嵌套写法：

```java
.where(w -> w.gt(Guest::getId, 5)
    .lt(Guest::getId, 10)
    .or(o -> o.in(Guest::getId, Arrays.asList(17, 18, 19))))
```

其中 `and` 和 `or` 的嵌套需要注意，根据大部分常见情况做了调整，`and` 组里面的多个条件以 `or` 连接，`or` 组里面的多个条件以 `and` 连接。

SQL：

```sql
((name = 'cyx' and age = 30) or (name = 'jack' and age = 60))
```

构建结构：

```java
.where(w -> w.and(
  o -> o.or(a -> a.eq(Guest::getName, "cyx")
               .eq(Guest::getAge, 30))
        .or(r -> r.eq(Guest::getName, "jack")
               .eq(Guest::getAge, 60))
  )
```

## 插入

支持插入一个实体和批量插入，可插入的字段受 JPA  `@Id` 和 `@Column(insertable = false)` 约束。

## 更新/删除

不指定 where 条件的情况下默认根据被标记了 `@Id` 的字段构建条件例如 `where id = :id` ，更新和删除的 where 条件构建器中参数支持特定的操作符 `.identity()` ，其含义如下：

- 表明这个字段名是一个**标识符**；
- 这个条件的值来自于参数字典；

data: `{id: 101, name: 'chengyuxing', age: 32}`

```java
int i = baki.entity(Guest.class).update(data, true,
          w -> w.identity(Guest::getAge, StandardOperator.GT)
                .gte(Guest::getId, 100)
)
```

1. `.identity()` 构建出条件 `age > :age` ；

2. `.gte()` 构建出条件 `id >= :id_0` 

标识符不会自动编号，值就来自于 `data` ，而其他操作符的值来自于外部，最终生成的 SQL 为：

```sql
update guest set name = :name where age > :age and id >= :id_0
```

排除 JPA `@Id` 和 `@Column(updatable = false)` 的约束外，没有出现在 where 条件中的**标识符**都会作为更新字段出现在更新语句的 `set` 中。

