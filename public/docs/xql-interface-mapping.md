# XQL 文件接口映射

类似于 MyBatis 的 XQL 绑定接口，支持已注册到 **XQLFileManager** 的 **XQL**文件映射（ `BakiDao#proxyXQLMapper` ）到标记了注解 `@XQLMapper` 的接口，通过动态代理调用方法来执行相应的查询等操作。

```java
ExampleMapper mapper = baki.proxyXQLMapper(ExampleMapper.class)
```

`example.xql`

```sql
/*[queryGuests]*/
select * from test.guest where id = :id;

/*[addGuest]*/
insert into test.guest(name, address, age)values (:name, :address, :age);
```

`ExampleMapper.java`

```java
@XQLMapper("example")
public interface ExampleMapper {
  List<DataRow> queryGuests(Map<String, Object> args);
  
  @XQL(value = "queryGuests")
  Optional<Guest> findById(@Arg("id") int id);
  
  @XQL(type = SqlStatementType.insert)
  int addGuest(DataRow dataRow);
}
```

> @XQLMapper 注解中的值对应 XQLFileManager 中已注册的 XQL 文件别名。
>
> 如果装有 Rabbit SQL 插件，可以使用插件来快速生成接口，参考指南 [IDEA 插件](guides/plugin#generate-interface) 。

## 接口规范

如果接口方法标记了以下特殊注解，将忽略接口的映射关系，并执行此注解的具体操作：

- 存储过程： `@Procedure`
- 函数： `@Function`

接口方法不能定义默认实现 `default` 方法。

## 映射规则

默认情况下，所有方法均根据前缀来确定执行类型，并且**SQL名字**和**接口方法**一一对应，如果不对应的情况下，使用注解 `@XQL(value = "sql名",type = SqlStatementType.insert)` 来指定具体的sql名字和覆盖默认行为 `unset`，接口方法定义需遵循如下规范：

| sql类型              | 方法前缀                                                  |
| -------------------- | --------------------------------------------------------- |
| select               | select \| query \| find \| get \| fetch \| search \| list |
| insert               | insert \| save \| add \| append \| create                 |
| update               | update \| modify \| change                                |
| delete               | delete \| remove                                          |
| procedure / function | call \| proc \| func                                      |

## 参数类型

- 参数字典：`DataRow` 、 `Map<String,Object>` 、 `<JavaBean>`
- 参数列表：使用注解 `@Arg` 标记每个参数的名字

## 返回值类型

接口方法返回值类型定义如下表：

| 返回类型                                               | sql类型                                       | 备注                             |
| ------------------------------------------------------ | --------------------------------------------- | -------------------------------- |
| `List<DataRow/Map<String,Object>/<JavaBean>>`          | query                                         |                                  |
| `Set<DataRow/Map<String,Object>/<JavaBean>>`           | query                                         |                                  |
| `Stream<DataRow/Map<String,Object>/<JavaBean>>`        | query                                         |                                  |
| `Optional<DataRow/Map<String,Object>/<JavaBean>>`      | query                                         |                                  |
| `Map<String,Object>`                                   | query                                         |                                  |
| `PagedResource<DataRow/Map<String,Object>/<JavaBean>>` | query                                         | `@CountQuery`，`@PageableConfig` |
| `IPageable`                                            | query                                         | `@CountQuery`，`@PageableConfig` |
| `Long`, `Integer`, `Double`                            | query                                         |                                  |
| `<JavaBean>`                                           | query                                         |                                  |
| `DataRow`                                              | query, procedure, function, plsql, ddl, unset |                                  |
| `int/Integer`                                          | insert, update, delete                        |                                  |

## 分页查询配置

如果方法返回值类型为 `PagedResource` 或 `IPageable` 可配置更多的参数。

**条数查询配置**：默认情况下，条数查询语句将使用简单的 `count(*)` 语句来构建，例如:

```sql
select count(*) from ( /*你的查询语句*/ );
```

可通过注解 `@CountQuery()` ，自定义条数查询语句。

**分页参数配置**：`@PageableConfig` 属性：

- `disableDefaultPageSql` : 禁用框架内置的自动构建分页查询 SQL 并**按顺序**指定分页参数键名 `[start, end]` ，框架计算好的参数，例如：

  ```sql
  # PostgreSQL
  select * from test.user limit start offset end;
  
  # Oracle
  select *
    from (select t.*, rownum ROW_NUM_KEY
          from (...) t
          where rownum <= end)
     where ROW_NUM_KEY >= start;
  ```

- `pageHelper` : 不使用内建的全局分页，仅针对此条 SQL 使用自定义的分页提供实现。

