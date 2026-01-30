# XQL 文件管理器

XQL 文件管理器，对普通 SQL 文件的标准进行了**扩展**，不破坏标准的前提下通过特殊格式化的注释进行了扩展支持脚本进行逻辑判断，得以支持[动态 SQL](documents/dynamic-sql)，并对各类 SQL 开发工具都有语法高亮，智能提示和错误检测，所以也是更加强大的 SQL 文件解析器。

支持解析的文件类型为 `.sql` 和 `.xql` 文件，`.xql` 文件本质上也是标注的 SQL 文件，但 `.xql` 文件作为专有文件标识符，可以获得[插件](guides/plugin)的支持。

每个 `.xql` 文件都被解析为结构化对象，每个对象被称之为 `XQL 函数体` ：

```sql
/*[queryGuests]*/
/*#查询访客#*/
-- #check :age > 30 throw '年龄不能大于30岁'
-- #var id = 14
-- #var users = 'a,xxx,c' | split(',')
select * from test.guest where id = :id
and name in (
    -- #for item of :users delimiter ', '
        :item
    -- #done
        )
```

一个函数体由几部分构成：

- 函数名称；
- 函数描述；
- 函数体：包含 SQL 字符串 和动态 SQL 指令脚本；

`.xql` 文件必须遵循 **"k-v"** 结构，每个 XQL 函数体以分号 `;` 结尾为分隔符，例如 `my.sql`：

```sql
/*#查询#*/
/*[query]*/
select * from test."user" t ${part1};

/*{part1}*/
where id = :id
${order};

/*{order}*/
order by id;

...
```

- SQL 描述格式为 `/*#some description...#*/`;
- 对象名格式为 `/*[name]*/` ，函数体中可以嵌套 SQL 片段，使用 `${片段名}` 指定;
- 片段名格式为 `/*{name}*/` ，SQL 片段中可以嵌套 SQL 片段，支持片段复用，使用 `${片段名}` 指定，如上例子在解析完成后名为 `query` 的 SQL 变为：

```sql
select * from test."user" t where id = :id order by id;
```

## 配置文件

内置 `!path` 标签函数：可用于连接列表为一个路径字符串。

`xql-file-manager.yml`

```yaml
constants:
#  base: &basePath pgsql

files:
# 使用 !path 标签合并列表得到 "pgsql/bar.xql"
   foo: !path [ *basePath, foo.xql ]
   bar: bar.xql
   remote: http://127.0.0.1:8080/share/cyx.xql?token=${env.TOKEN}

pipes:
#  upper: org.example.Upper

charset: UTF-8
named-param-prefix: ':'
```

`.xql` 文件配置在 `files` 节点下，key 为文件别名，值为文件路径，如果没有协议的情况下，默认为 `classpath` 路径下，详细的配置项说明参考文档[配置项](documents/api-config#md-head-21) 。
