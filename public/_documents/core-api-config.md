# 配置项

Rabbit SQL 详细的类和接口配置项。

## BakiDao

Baki 接口的默认实现。

### globalPageHelperProvider

全局分页提供程序，通过实现此接口来支持更多数据库分页。例如内置实现没有直接匹配人大金仓、达梦等数据库，BakiDao 会通过 JDBC 驱动获取数据库名称，再决定使用哪个分页实现：

```java
(info, namedParamPrefix) -> {
   if (info.getName().equals("kingbasees")) {
       return new PGPageHelper();
   }
   if (info.getName().equals("dm dbms")) {
     return new OraclePageHelper();
   }
   return null;
};
```

如上例子，人大金仓直接使用 PostgreSQL 的实现即可，达梦使用 Oracle 的即可，或者自行实现接口 `com.github.chengyuxing.sql.page.PageHelper` 。

### sqlInterceptor

SQL 拦截器。在 **SQL 解析开始**时，可以通过抛出特定异常拦截不满足条件的 SQL，阻止其执行。

### statementValueHandler

自定义预编译 SQL 参数值处理器，默认实现支持的特殊值类型包括：

- `java.util.Date`
- java8 新的日期时间：`LocalDateTime` ， `LocalDate` ，`LocalTime` ， `OffsetDateTime` ， `OffsetTime` ， `ZonedDateTime` ， `Instant` 
- `java.util.UUID`
- `java.io.InputStream`
- `java.io.File`
- `java.nio.file.Path`

### executionWatcher

SQL 执行观察者，可用于记录 SQL 执行开始时间和结束时间，可用于记录日志、统计 SQL 耗时、性能分析、SQL 审计等操作。

### xqlFileManager

[XQL 文件管理器](documents/xql-file-manager)，统一管理 SQL，执行[动态 SQL](documents/xql-dynamic-sql)，和[插件](guides/plugin)协同工作，支持 [Baki](documents/core-baki) 接口通过 `&` 取地址符来获取并执行动态 SQL

### batchSize

JDBC 底层批量操作大小，默认为 1000。

### pageKey

分页查询的当前页码参数名，默认为 `page` ，在调用方法时，`.pageable(page?, size?)` 时，如果参数中有对应值，则可以不用写。

### sizeKey

分页查询的每页条数参数名，默认为 `size` ，在调用方法时，`.pageable(page?, size?)` 时，如果参数中有对应值，则可以不用写。

### queryTimeoutHandler

查询超时处理器，默认值为 `0`，表示没有超时限制。可根据需求设置超时时间，避免慢查询堆积占满连接池。

### queryCacheManager

查询缓存管理器，支持自定义缓存实现，如 Redis、内存缓存等。命中缓存时直接从缓存中获取结果，提高性能。启用后会作用于以下查询：

- `query()` 
- `executeQueryStream()` 
- `entity(class).query()` 

详细配置参考[查询缓存管理](guides/cache-redis)。

### entityMetaProvider

框架内部接口涉及到实体返回实体的操作都将使用此函数来对字段进行映射匹配和值的转换。

### databaseInfoProvider

数据库信息提供者，主要用于动态数据源或其他不需要默认数据库信息的情况。通过实现该接口，可以改变框架内部的数据库信息初始化逻辑。

例如：`baki.query(...).findFirstEntity(User.class)`

##  IPageable

分页查询构建器。

### args

分页查询 SQL 的总参数。

### count

记录条数：可以传入数字总条数，也可以传入字符串形式的 `count` 查询语句。

### disableDefaultPageSql

禁用默认分页查询 SQL 生成，并指定条数查询语句，同时重写默认分页参数 `[start, end]`。

### pageHelper

针对当前执行的 SQL，优先使用局部配置的分页提供者；未配置时，使用全局分页提供者 `BakiDao#globalPageHelperProvider`。

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
```

### constants

字符串模板常量池。初始化时，如果 SQL 中出现 `${base}` 这样的模板占位符，框架会从常量池中查找并替换为对应值，例如 `pgsql`。

也可以通过 YAML 的锚点语法为常量定义 `&basePath`，供后面的变量引用。

### files

XQL 文件字典集合，键为别名，值为 SQL 文件名。路径支持 YAML 数组语法，通过内置 `!path` 函数自动连接为一个路径。之后可以通过 `别名.SQL名` 获取 SQL，例如 `my.query`。

文件路径支持的格式有：

- **Classpath**: `sql/rabbit.sql`
- URI 格式:
  - **Windows**: `file:/D:/rabbit.sql`
  - **Linux/Unix**: `file:/root/rabbit.sql`
  - **HTTP(S)**: `http(s)://host/rabbit.sql`
  - **FTP**: `ftp://username:password@ftp.example.com/path/rabbit.sql`

文件路径支持环境变量 `${env.}`，如上 `${env.TOKEN}`  将获取系统环境变量 `TOKEN` 。

### pipes

动态 SQL 脚本引擎的自定义管道操作符字典，**key** 是管道名，**value** 是管道实现类的完整限定类名。通过添加自定义**管道**可以增强[动态 SQL 表达式](documents/xql-dynamic-sql)的能力。

### charset

解析 XQL 文件所使用的编码，默认为 `UTF-8`。

### namedParamPrefix

命名参数前缀符号，默认为 `:`，例如 `where id = :id`。可以自定义以适配不同环境。例如图数据库 `Neo4j` 的语法中 `:` 表示类型，会和命名参数前缀冲突，此时可以改为其他符号来避免执行异常。
