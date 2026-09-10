# 分页查询

Rabbit SQL 默认会根据当前数据库自动生成分页 SQL，并自动生成 `count` 查询。

## 基础分页

```java
PagedResource<DataRow> resource = baki.query("select * from test.user where id > :id")
    .arg("id", 10)
    .pageable(1, 20)
    .collect();
```

如果参数中已经包含默认的 `page` 和 `size`，可以直接：

```java
baki.query("...")
    .args(Args.of("page", 1, "size", 20, "id", 10))
    .pageable()
    .collect();
```

默认的页码参数名和每页条数参数名可以通过 `BakiDao#pageKey` / `BakiDao#sizeKey` 配置。

## 自定义 count 查询

默认使用简单 `count(*)` 包装。需要更优性能时，可以手动指定：

```java
baki.query("select ... where id > :id")
    .arg("id", 10)
    .pageable(1, 20)
    .count("select count(*) from test.user where id > :id")
    .collect();
```

## 禁用默认分页 SQL

当分页部分位于子查询、视图或 CTE 中时，需要禁用默认分页 SQL，并指定 count 查询和分页参数名：

```sql
with cte as (
  select * from test.region
  where id > :id limit :length offset :index
)
select * from cte;
```

```java
PagedResource<DataRow> res = baki.query("&data.custom_paged")
    .pageable(1, 7)
    .disableDefaultPageSql("&data.custom_paged_count", "length", "index")
    .collect();
```

## 返回实体分页

```java
PagedResource<Guest> guests = baki.query("select ...")
    .pageable(1, 10)
    .collect(row -> row.toEntity(Guest.class));
```

## 接口映射中的分页配置

当使用 XQL 接口映射时，可以通过注解配置：

```java
@XQL("queryGuests")
@PageableConfig(disableDefaultPageSql = {"start", "end"})
@CountQuery("queryGuestsCount")
PagedResource<Guest> queryGuests(DataRow args);
```

详细接口映射规则见 [XQL 接口映射](documents/xql-interface-mapping)。

## 自定义分页提供者

如果内置分页实现不满足数据库需求，可以实现 `PageHelperProvider`，或针对单条查询调用：

```java
.pageable(1, 10)
.pageHelper(new MyPageHelperProvider())
```
