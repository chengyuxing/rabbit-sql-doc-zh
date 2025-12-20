## SQL参数占位符

SQL 预编译参数占位符默认使用原生 JDBC 的命名参数写法 `:key` 和 模版占位符 `${key}` 。

参数名支持对象属性值路径表达式，值类型可以是 `Map` 、Java Bean、数组、集合：

- `user.name` ：获取 `user` 对象的属性 `name` 值；
- `user.friends.0` ：获取 `user` 对象的属性 `friends` （可以是一个数组或集合）的第一个值 。

### 预编译SQL

预编译sql的语法使用**命名参数**，例如：

`:name` ( JDBC 标准的命名参数写法，SQL 将被预编译安全处理，参数名为 `name` )

> 最终被编译为 `?`，极力推荐使用预编译sql，可以有效避免sql注入的风险。

### 字符串模版

`${[!]name}` (通用的字符串模版占位符，不进行预编译，可用于sql片段的复用)

字符串模版有2种格式：

- `${name}` 如果类型是**装箱类型数组( String[], Integer[], ...)或集合(Set, List, ...)**，则先展开（逗号分割），再进行sql片段的替换；
- `${!name}` 名字前多了前缀符号( `!` )，如果类型是**装箱类型数组(String[], Integer[]...)或集合(Set, List...)**，则先展开（逗号分隔），并做一定的字符串安全处理，再进行 SQL 片段的替换。

### 示例

SQL：

```sql
select ${fields} from ... where word in (${!words}) or id = :id;
```

数据：

```javascript
{fields: ['name', 'age'], words:['I\'m ok!', 'b', 'c'], id: 1}
```

最终生成的 SQL：

```sql
select name, age from ... where word in ('I''m ok!', 'b', 'c') or id = ?;
```

