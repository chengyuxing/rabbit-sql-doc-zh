# XQL 体系

XQL 是 Rabbit SQL 的核心能力，用于在不破坏原生 SQL 的前提下，让 SQL 具备动态化和工程化能力。

- [XQL 文件管理器](documents/xql-file-manager)：管理 SQL 文件、模板、元数据。
- [动态 SQL](documents/xql-dynamic-sql)：基于注释扩展的控制流和表达式脚本。
- [XQL 接口映射](documents/xql-interface-mapping)：把 XQL 文件映射为 Java 接口。

## 一个典型 XQL

`#check` 写的是需要拒绝的条件，条件为 `true` 时抛出指定异常。下面的例子会拒绝空值及小于等于 `0` 的 `id`，正数则继续执行。

```sql
/*[queryUsers]*/
/*#查询用户#*/
-- #check :id == null || :id <= 0 throw 'id 必须大于 0'
select * from test.user
where
-- #if :name
  name = :name
-- #fi
;
```

使用：

```java
baki.query("&example.queryUsers")
    .arg("id", 1)
    .arg("name", "cyx")
    .rows();
```

