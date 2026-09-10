# 安全与审计

## 使用预编译参数

用户输入必须通过命名参数传入：

```java
baki.query("select * from test.user where name = :name")
    .arg("name", userInput)
    .rows();
```

不要直接拼接：

```java
// 错误示范
String sql = "select * from test.user where name = '" + userInput + "'";
```

## 谨慎使用字符串模板

`${name}` 和 `${!name}` 主要用于 SQL 片段复用，不是安全的参数绑定方式。只有明确知道数据来源安全时才使用。

## 使用 #check 做前置校验

在动态 SQL 中校验参数，提前拒绝非法请求：

```sql
-- #check :id > 0 throw 'id 必须大于 0'
select * from test.user where id = :id;
```

## SQL 审计与黑名单

通过 `SqlInterceptor` 统一审计 SQL：

```java
bakiDao.setSqlInterceptor((rawSql, parsedSql, args, info) -> {
    auditLog.info("sql={}, args={}, db={}", parsedSql, args, info.getName());
    if (parsedSql.toLowerCase().contains("drop table")) {
        throw new SecurityException("禁止执行 DROP TABLE");
    }
    return parsedSql;
});
```

## 日志脱敏

打印参数时，应避免记录密码、手机号、身份证等敏感字段。可以在 `AroundExecutor` 或日志层做脱敏处理。

