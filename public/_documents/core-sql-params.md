## SQL参数占位符

SQL 预编译参数占位符默认使用原生 JDBC 的命名参数写法 `:key`，同时还提供字符串模板占位符 `${key}`。

参数名支持对象属性值路径表达式，值类型可以是 `Map` 、Java Bean、数组、集合：

- `user.name` ：获取 `user` 对象的属性 `name` 值；
- `user.friends[0]` ：获取 `user` 对象的属性 `friends` （可以是一个数组或集合）的第一个值 。

### 预编译SQL

预编译 SQL 使用**命名参数**，例如：

`:name`（JDBC 标准的命名参数写法，SQL 会被预编译安全处理，参数名为 `name`）

> 最终会被编译为 `?`。极力推荐使用预编译 SQL，它可以有效避免 SQL 注入风险。

### 字符串模板

`${[!]name}`（通用的字符串模板占位符，不进行预编译，主要用于复用 SQL 片段）

字符串模板有两种格式：

- `${name}`：如果值是数组（`String[]`、`Integer[]` 等）或集合（`Set`、`List` 等），会先按逗号展开，再替换 SQL 片段；
- `${!name}`：名字前多了 `!`，如果值是数组或集合，会先按逗号展开，并做必要的字符串安全处理，再替换 SQL 片段。

### 示例

SQL：

```sql
select ${fields} from ... where word in (${!words}) or id = :id;
```

参数：

```javascript
{fields: ['name', 'age'], words:['I\'m ok!', 'b', 'c'], id: 1}
```

最终生成的 SQL：

```sql
select name, age from ... where word in ('I''m ok!', 'b', 'c') or id = ?;
```
