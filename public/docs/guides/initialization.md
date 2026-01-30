# 单独使用初始化

在 maven 项目 `pom.xml` 中引入依赖：

_java 8+_

```xml
<dependency>
    <groupId>com.github.chengyuxing</groupId>
    <artifactId>rabbit-sql</artifactId>
    <version>10.2.2</version>
</dependency>
```

在 **resources** 目录下创建 `xql-file-manager.yml` ：

```yaml
constants:
#  base: &basePath pgsql

files:
# 使用 !path 标签合并列表得到 "pgsql/bar.xql"
   foo: !path [ *basePath, foo.xql ]
   bar: bar.xql
   remote: http://127.0.0.1:8080/share/cyx.xql?token=${env.TOKEN}

# pipes:
#  upper: org.example.Upper

# charset: UTF-8
# named-param-prefix: ':'
```

实例化 `BakiDao` ：

```java
Datasource datasource = new HikariDataSource();
datasource.setJdbcUrl();
datasource.setUsername();
datasource.setPassword();
...
BakiDao baki = new BakiDao(dataSource);
```

实例化并配置 [XQL 文件管理器](documents/xql-file-manager)：

```java
XQLFileManager xqlFileManager = new XQLFileManager("xql-file-manager.yml");
...
baki.setXqlFileManager(xqlFileManager);
```

通过 `baki` 来执行 SQL 访问数据库，具体操作可以[参考详细文档](documents/baki)或直接参考[最佳实践](documents/best-practice) 。
