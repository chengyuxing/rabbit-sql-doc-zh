# 配置项

Rabbit SQL 详细的类和接口配置项。

## BakiDao

Baki 接口的默认实现。

### globalPageHelperProvider

全局分页提供程序，通过实现此接口来支持更多的数据库分页，例如内置的实现并没有匹配人大金仓 、达梦等数据库，BakiDao内置通过 JDBC 驱动来获取数据库名称来决定使用哪个分页实现：

```java
(databaseMetaData, dbName, namedParamPrefix) -> {
   if (dbName.equals("kingbasees")) {
       return new PGPageHelper();
   }
   if (dbName.equals("dm dbms")) {
     return new OraclePageHelper();
   }
   return null;
};
```

如上例子，人大金仓直接使用 PostgreSQL 的实现即可，达梦使用 Oracle 的即可，或者自行实现接口 `com.github.chengyuxing.sql.page.PageHelper` 。

### sqlInterceptor

SQL 拦截器，在**SQL解析开始**时通过抛出特定异常来拦截不满足条件的 SQL，阻止 SQL 执行。

### statementValueHandler

自定义预编译 SQL 参数值处理器，默认实现支持的特殊值类型包括：

- `java.util.Date`
- java8 新的日期时间：`LocalDateTime` ， `LocalDate` ，`LocalTime` ， `OffsetDateTime` ， `OffsetTime` ， `ZonedDateTime` ， `Instant` 
- `com.github.chengyuxing.common.MostDateTime`
- `java.util.UUID`
- `java.io.InputStream`
- `java.io.File`
- `java.nio.file.Path`

### executionWatcher

SQL 执行观察者，可用于记录 SQL 执行开始时间和结束时间，可用于记录日志、统计 SQL 耗时、性能分析、SQL 审计等操作。

### xqlFileManager

[XQL 文件管理器](documents/xql-file-manager)，统一管理 SQL，执行[动态 SQL](documents/dynamic-sql)，和[插件](guides/plugin)协同工作，支持 [Baki](documents/baki) 接口通过 `&` 取地址符来获取并执行动态 SQL

### batchSize

JDBC 底层批量操作大小，默认为 1000。

### namedParamPrefix

命名参数前缀符号，默认为 `:` ，例如 `where id = :id` ，可以自定义来适配不同的环境，例如图数据库 `Neo4j` 的语法中 `:` 表示类型，此时和命名参数前缀冲突，可以自定义为其他符号来避免执行异常。

### pageKey

分页查询的当前页码参数名，默认为 `page` ，在调用方法时，`.pageable(page?, size?)` 时，如果参数中有对应值，则可以不用写。

### sizeKey

分页查询的每页条数参数名，默认为 `size` ，在调用方法时，`.pageable(page?, size?)` 时，如果参数中有对应值，则可以不用写。

### queryTimeoutHandler

查询超时处理器，默认值为 0 ，表示没有超时限制，根据需求自行设置超时时间，可避免慢查询堆积沾满连接池。

### queryCacheManager

查询缓存管理器，支持自定义缓存实现，如 Redis 、内存数据库等，如果命中缓存，直接从缓存中获取结果，提高性能，支持的接口方法为：

- `query()` 
- `executeQueryStream()` 
- `entity(class).query()` 

详细配置参考文档[查询缓存管理](documents/query-cache-manage) 。

### entityMetaProvider

框架内部接口涉及到实体返回实体的操作都将使用此函数来对字段进行映射匹配和值的转换。

例如：`baki.query(...).findFirstEntity(class)`

##  IPageable

分页查询构建器。

### args

分页查询 SQL 总的参数。

### count

记录条数：可以传入数字记录条数，或者字符串为 `count` 查询语句。

### disableDefaultPageSql

禁用默认的字段分页查询 SQL 生成，并指定条数查询语句。

### rewriteDefaultPageArgs

重写默认的分页参数，以适配自定义的分页查询 SQL ：

```java
args -> {
       args.updateKey(START_NUM_KEY, "my_limit");
       args.updateKey(END_NUM_KEY, "my_offset");
       return args;
  }
```

### pageHelper

针对当前执行的 SQL ，优先使用局部的分页提供者，其次使用全局的分页帮助提供者 `BakiDao#globalPageHelperProvider` 。

## XQLFileManager

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
database-id:
```

### constants

字符串模版常量池，在初始化时，例如 SQL 中有 `${base}` 的模版占位符，则从常量池中查找，如果找到就替换为 `pgsql` 。

也能通过 Yaml 的语法为常量定一个锚点 `&basePath` ，用在后面的变量中。

### files

XQL 文件字典集合，键为别名，值为 SQL 文件名，路径支持 Yaml 的数组语法，通过内置的 `!path` 函数自动连接为一个路径，可通过 `别名.sql名` 来获取 SQL，如上例子：`my.query`；

文件路径支持的格式有：

- **Classpath**: `sql/rabbit.sql`
- URI 格式:
  - **Windows**: `file:/D:/rabbit.sql`
  - **Linux/Unix**: `file:/root/rabbit.sql`
  - **HTTP(S)**: `http(s)://host/rabbit.sql`
  - **FTP**: `ftp://username:password@ftp.example.com/path/rabbit.sql`

文件路径支持环境变量 `${env.}`，如上 `${env.TOKEN}`  将获取系统环境变量 `TOKEN` 。

### pipes

动态 SQL 脚本引擎自定义管道操作符字典，**key** 为管道名，**value **为管道类全名，通过添加实现自定义的**管道**来增强[动态 SQL 表达式](documents/dynamic-sql)的功能。

### charset

解析XQL文件所使用的编码，默认：`UTF-8`。

### namedParamPrefix

主要作用于插件解析执行命名参数动态SQL。

### databaseId

主要作用于插件解析执行动态SQL时的参数。
