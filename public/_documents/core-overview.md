# 核心使用

Rabbit SQL 的核心能力围绕 `Baki` / `BakiDao` 展开。这里汇总了日常开发中最常用的 API 和概念：

- [核心接口 Baki](documents/core-baki)
- [SQL 参数占位符](documents/core-sql-params)
- [参数与结果对象](documents/core-args)
- [事务](documents/core-transaction)
- [实体操作与 DSL 查询](documents/core-entity)
- [分页查询](documents/core-pagination)
- [配置项](documents/core-api-config)
- [BakiDao 低级执行方法](documents/core-bakidao)

## 快速理解

`Baki` 是面向业务的高层接口，通常注入后直接使用：

```java
@Autowired
Baki baki;

List<DataRow> rows = baki.query("&example.queryUsers")
    .args("id", 10)
    .rows();
```

如果需要更底层的 JDBC 控制，则使用 `BakiDao` 的扩展方法。

