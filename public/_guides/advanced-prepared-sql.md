# 预编译 SQL 科普

这虽然是很基础的知识点，但实际项目中仍有不少人不够了解，因此有必要再次科普。

预编译 SQL 是预防 SQL 注入最基本的手段。在项目开始前，非常有必要了解预编译 SQL。现在大部分框架都支持预编译 SQL，例如：

```sql
select * from test.user where id = ?；
insert into test.user (id, name) values (?, ?);
```

## 关于

预编译 SQL 的参数占位符为 `?`，并且**预编译参数占位符只能出现在允许传参的位置**，这是数据库的强制性规则。使用预编译 SQL 有以下好处：

1. 预防 SQL 注入；
2. 避免拼接参数引号 `'` 问题，降低错误率；
3. 获得数据库底层优化：SQL 相同，仅仅参数不同，数据库可以对 SQL 进行缓存，优化执行计划，提高性能；

常见框架中的预编译参数写法：

- Rabbit SQL： `:id`
- MyBatis： `#{id}`
- JPA： `:id`（或位置参数 `?1`）

> 这些框架专属写法最终都会被转换为数据库支持的 `?`。`?` 只能按顺序绑定参数，框架封装后可以按参数名传参，使用更方便。

在 Rabbit SQL 中，`${}` 叫[字符串模板占位符](documents/core-sql-params)。它虽然也能接收参数，但极不推荐直接用它绑定用户参数 ❌，因为它不会做参数安全处理。它的主要用途是**拼接 SQL 片段**，例如在 [XQL 文件管理器](documents/xql-file-manager)中：

```sql
/*[queryUsers]*/
select * from user where ${cnd};

/*{cnd}*/
id = :id;
```

SQL 片段内部仍应使用预编译参数占位符，最终拼接成的 SQL 为：

```sql
select * from user where id = :id;
```

除非有明确特殊需求且能确认不会产生注入风险，否则请尽可能使用预编译 SQL 占位符。
