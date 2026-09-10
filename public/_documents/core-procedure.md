# 存储过程与函数

使用 `Baki#call` 或 `BakiDao#executeCallStatement` 执行存储过程和函数。

## 参数模式

`Param` 支持三种模式：

```java
Param.IN(34);
Param.OUT(StandardOutParamType.INTEGER);
Param.IN_OUT(56, StandardOutParamType.INTEGER);
```

常用 OUT 类型：

- `StandardOutParamType.INTEGER`
- `StandardOutParamType.VARCHAR`
- `StandardOutParamType.REF_CURSOR`
- `StandardOutParamType.ORACLE_CURSOR`
- `StandardOutParamType.BOOLEAN`
- `StandardOutParamType.ARRAY`
- `StandardOutParamType.BLOB`
- `StandardOutParamType.TIMESTAMP`

## 单返回值

命名返回值写法：

```sql
{:res = call test.sum(:a, :b)}
```

```java
Integer result = baki.call("{:res = call test.sum(:a, :b)}",
        Args.of("res", Param.OUT(StandardOutParamType.INTEGER))
            .add("a", Param.IN(34))
            .add("b", Param.IN(56)))
    .getAs("res");
```

匿名返回值写法：

```sql
{call test.sum(:a, :b)}
```

此时可以通过索引 `0` 或默认 key `result` 获取结果。

## 多返回值

多个出参时，按顺序或名称获取：

```sql
{call multiple_result(:id, :res1, :res2)}
```

```java
DataRow result = baki.call("{call multiple_result(:id, :res1, :res2)}",
    Args.of("id", Param.IN(10))
        .add("res1", Param.OUT(StandardOutParamType.INTEGER))
        .add("res2", Param.OUT(StandardOutParamType.VARCHAR)));

Integer res1 = result.getAs("res1");
String res2 = result.getAs("res2");
```

## 游标结果

如果返回值是游标，结果类型通常为 `List<DataRow>`：

```java
List<DataRow> rows = baki.call("{:res = call test.get_users(:id)}",
        Args.of("res", Param.OUT(StandardOutParamType.REF_CURSOR))
            .add("id", Param.IN(10)))
    .getAs("res");
```

## 数据库差异

不同数据库的调用语法略有不同。例如 PostgreSQL v13+ 使用 `create procedure` 创建的过程，调用时不需要 `{}`：

```sql
call procedure()
```

PostgreSQL 中使用 Python 创建的返回表函数，只能使用匿名返回值写法。

