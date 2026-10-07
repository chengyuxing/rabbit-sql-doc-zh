## SQL参数占位符

Rabbit SQL 默认使用命名参数占位符 `:key`，框架会将其转换成 JDBC 的 `?` 并绑定值；另外提供字符串模板占位符 `${key}`。

参数名支持对象属性值路径表达式，值类型可以是 `Map` 、Java Bean、数组、集合：

- `user.name` ：获取 `user` 对象的属性 `name` 值；
- `user.friends[0]` ：获取 `user` 对象的属性 `friends` （可以是一个数组或集合）的第一个值 。

### 预编译SQL

预编译 SQL 使用**命名参数**，例如：

`:name`（Rabbit SQL 的命名参数写法，参数名为 `name`，转换为 JDBC 占位符后预编译并绑定参数值）

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

### 引号、注释中的冒号

命名参数解析会跳过字符串、注释和带引号的标识符，也支持 PostgreSQL 的美元引号字符串 `$$...$$` / `$tag$...$tag$`、MySQL 反引号标识符及双反引号转义。例如下面的 SQL 只绑定 `id`，不会把 `word` 当作参数：

```sql
select :id as `label:word`;
```

这属于命名参数的词法处理；`${...}` 字符串模板仍按模板规则展开。
