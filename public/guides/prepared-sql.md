# 预编译 SQL 科普

虽然这是一个很基础的知识点，我发现其实还有很多人都不了解，有必要再次科普下。

预编译 SQL 是预防注入最基本的手段，在正式开始一个项目之前，非常有必要了解预编译 SQL ，现在大部分框架都支持预编译 SQL，如下这是预编译 SQL ：

```sql
select * from test.user where id = ?；
insert into test.user (id, name) values (?, ?);
```

## 关于

预编译 SQL 参数值的占位符为 `?` ，并且，**预编译 SQL 参数占位符只能出现在可以传入参数的位置**，这是数据库的强制性规则，使用预编译 SQL 有如下好处：

1. 预防 SQL 注入；
2. 避免拼接参数引号 `'` 问题，降低错误率；
3. 获得数据库底层优化：SQL 相同，仅仅参数不同，数据库可以对 SQL 进行缓存，优化执行计划，提高性能；

常见框架中的预编译参数占位符：

- Rabbit SQL： `:id`
- MyBatis： `#{id}`
- JPA： `?id`

> 这些框架专属的写法最终都会被转换为数据库支持的 `?` ，因为 `?` 只能按顺序填入参数，框架的封装方便用户根据参数名来传入参数。

在 Rabbit SQL 中，`${}` 这个占位符叫做[字符串模版占位符](documents/sql-params)，同样可以用来当作参数占位符，但这是极不推荐的 ❌ ，因为并不进行参数的安全处理，主要作用是**拼接 SQL 片段**，如下例子在 [XQL File Manager](documents/xql-file-manager) 中：

```sql
/*[queryUsers]*/
select * from user where ${cnd};

/*{cnd}*/
id = :id;
```

SQL 片段中也应该写预编译 SQL 参数占位符，最终拼接而成的 SQL 为：

```sql
select * from user where id = :id;
```

非必要情况下，尽可能使用预编译 SQL 占位符，除非无法满足您特殊需求，您明确知道不会产生注入风险。