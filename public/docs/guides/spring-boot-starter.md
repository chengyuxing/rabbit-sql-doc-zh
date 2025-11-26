# 与Spring Boot 集成

在 maven 项目 `pom.xml` 中引入依赖：

_java 8+_

```xml
<dependency>
    <groupId>com.github.chengyuxing</groupId>
    <artifactId>rabbit-sql-spring-boot-starter</artifactId>
    <version>5.0.6</version>
</dependency>

```

在 `application.yml` 中添加数据源：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://127.0.0.1:5432/postgres
    username: chengyuxing
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
# database-id:
```

注入 Baki 接口来执行 SQL 访问数据库：

```java
@Autowired
Baki baki;
```

具体操作可以[参考详细文档](documents/with-spring-boot)或直接参考[最佳实践](documents/best-practice) 。
