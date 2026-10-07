# 参数与结果对象

除了直接使用 `Map` 传参，Rabbit SQL 还提供了几个常用的参数和结果对象，能让代码更简洁。

## Args

`com.github.chengyuxing.sql.Args` 是专门用来组织 SQL 参数的对象。

```java
Args.of("id", 10, "name", "cyx");
Args.of().add("id", 10).add("name", "cyx");
```

也可以从实体生成参数：

```java
Args.ofEntity(user);
Args.ofEntity(user, field -> "u_" + field.getName());
```

## DataRow

`com.github.chengyuxing.common.DataRow` 既可以用作结果行，也可以用作参数对象。

创建：

```java
DataRow.of("id", 10, "name", "cyx");
DataRow.ofEntity(user);
```

读取：

```java
row.getAs("name");
row.getAs("name", "默认值");
row.getAs(0);
```

深层取值：

```java
row.deepGetAs("user.name");
row.walkAs("/user/address/0");
row.accessAsIgnoreCase("Username");
```

子集和转换：

```java
row.pick("id", "name");
Guest guest = row.toEntity(Guest.class);
```

## Param

执行存储过程或函数时，使用 `com.github.chengyuxing.sql.types.Param` 描述参数模式：

```java
Param.IN(34);
Param.OUT(StandardOutParamType.INTEGER);
Param.IN_OUT(56, StandardOutParamType.INTEGER);
```

具体用法可参考 [Baki 核心接口](documents/core-baki)。

## 继承属性与自定义列名

`Args.ofEntity(...)`、`DataRow.ofEntity(...)` 和 `DataRow#toEntity(...)` 使用 JavaBean 属性和对应字段。字段可来自多层父类，子类同名字段优先；子类重写 getter 不会丢失父类字段元数据。没有对应字段的计算属性不会映射。

自定义列名时，实体转参数和结果转实体两侧应采用一致的映射规则。需要解析 JPA 等注解时，通过 [实体元数据提供者](documents/core-entity) 配置框架中的映射。
