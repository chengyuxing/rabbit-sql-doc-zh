# XQL 文件管理器

SQL 文件管理器，对普通 SQL 文件的标准进行了**扩展**，不破坏标准的前提下通过特殊格式化的注释进行了扩展支持脚本进行逻辑判断，得以支持[动态 SQL](documents/dynamic-sql)，所以也是更加强大的 SQL 文件解析器。

支持 `.sql` 文件，对各类 SQL 开发工具都有语法高亮，智能提示和错误检测，专业的 DBA 也能轻松参与项目直接编写 SQL 文件与 javaer 配合。

文件结尾以 `.sql` 或 `.xql` 结尾，文件中可以包含任意符合标准的注释，格式参考 `template.xql`；

💡 推荐使用 `.xql` 来获得[插件](guides/plugin)的支持！

每个被 **XQLFileManager** 管理的 SQL 文件都必须遵循 **"k-v"** 结构，例如 `my.sql`：

```sql
/*#some description...#*/
/*[query]*/
/*#some more 
  description...#*/
select * from test."user" t ${part1};

/*第一部分*/
/*{part1}*/
where id = :id
${order};

/*{order}*/
order by id;

...
```

- SQL 描述格式为 `/*#some description...#*/`;
- 对象名格式为 `/*[name]*/` ，SQL 文件中可以嵌套 SQL 片段，使用 `${片段名}` 指定;
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

delimiter: ;
charset: UTF-8
named-param-prefix: ':'
database-id:
```

详细的配置项说明参考文档[配置项](documents/api-config#md-head-21) 。
