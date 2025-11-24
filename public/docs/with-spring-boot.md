# 集成 Spring Boot

基于 rabbit-sql 制作的 spring-boot 自动装配 **starter**，默认使用 spring 的事务管理，方法头上可通过注解 `@Transactional` 生效或者手动注入 `com.github.chengyuxing.sql.spring.autoconfigure.Tx` （对 spring 事务的简易封装）来使用事务。

- 兼容 spring jdbc 事务；
- 兼容 mybatis、spring-data-jpa 等同时进行事务处理；

⚠️ 请勿使用 rabbit-sql 内置的 `Tx` 事务，事务已完全由 spring 全局事务替代。

- ~~com.github.chengyuxing.sql.transaction.Tx~~ ❌
- com.github.chengyuxing.sql.spring.autoconfigure.Tx ✅

## Maven 依赖

项目 pom.xml 中引入依赖：

*jdk8+*

```xml
<dependency>
    <groupId>com.github.chengyuxing</groupId>
    <artifactId>rabbit-sql-spring-boot-starter</artifactId>
    <version>5.0.5</version>
</dependency>
```

## 配置

如果 `resources` 目录下存在名为 `xql-file-manager.yml` 的配置文件，则 `baki` 将自动配置 [XQL 文件管理器](documents/xql-file-manager)。

`application.yml` 必要配置：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://127.0.0.1:5432/postgres
    username: chengyuxing
```

### 单数据源

默认情况配置 `spring.datasource` 即可通过注入 `Baki` 进行一些操作：

```java
@Autowired
Baki baki;
```

### 多数据源

1. 在 `spring.datasource` 节点下新增属性 `secondaries` 继续配置多个数据源，`properties` 取决于具体数据源的实现，默认是 `HikariDatasource` ，可通过属性 `class-name` 来指定其他数据源；

2. `baki` 节点下新增属性 `secondaries` ，配置多个 `baki` ，并指定属性 `datasource` 为数据源的名称；

![](docs/imgs/multiple-baki.png)

此时 Spring 上下文中就存在一个默认的 `baki` 和多个副 `baki` 实例，其他副 `baki` 在注入时通过注解 `@Qualifier` 来指定名称，也就是 `secondaries` 下每个节点的 key 名称：

```java
@Autowired
@Qualifier("slaveBaki")
Baki slaveBaki;
```

### 打印 SQL 日志

`application.yml`

```yaml
logging:
  level:
    root: info
    # 配置打印 SQL 日志
    com.github.chengyuxing: debug
```

### Baki 属性接口扩展

```yaml
baki:
  query-cache-manager: 
  # ...
```

Baki （包括 `secondaries` 节点下的副 `baki`） 中有一些属性为接口的类型可以注入 Spring 上下文，如果实现类中存在一个参数并且参数类型为 `org.springframework.context.ApplicationContext` 的构造函数，则此构造函数默认将被实例化，可以获取 Spring 上下文中的所有 Bean。

例如 `com.github.chengyuxing.sql.plugins.QueryCacheManager` 的实现类 `RedisCache` 中，可以从上下文中轻松的获取到 Redis 的 Bean，从而实现基于 Redis 的查询缓存管理：

```java
public class RedisCache implements QueryCacheManager {
    final ApplicationContext context;
    final RedisClient redisClient;
  
    public RedisCache(ApplicationContext context) {
        this.context = context;
      	this.redisClient = this.context.getBean(RedisClient.class);
    }
  
    @Override
    public Stream<DataRow> get(String key) {
       ...
    }

    @Override
    public void put(@NotNull String key, List<DataRow> value) {
        ...
    }
```

支持注入 Spring 上下文的属性接口有：

- `global-page-helper-provider`；
- `sql-interceptor`；
- `statement-value-handler`；
- `sql-parse-checker`；
- `sql-watcher`；
- `query-timeout-handler`；
- `query-cache-manager`；
- `executionWatcher`;
- `entityFieldMapper`;
- `entityValueMapper`;

## 注入

最直观的方式也就是注入 `Baki` 接口即可执行数据库访问操作，也是最灵活的方式，但框架也提供了 XQL 接口映射的方式，用过 MyBatis 的小伙伴一点都不会陌生。

### Baki 核心接口

```java
@Autowired
Baki baki;

@Autowired
@Qualifier("slaveBaki")
Baki slaveBaki;
```

### XQL 接口映射

在 Spring Boot 启动类上加入注解 `@XQLMapperScan` 来扫描 XQL 接口类，默认扫描所有包路径下带有 `@XQLMapper` 注解的接口。

接口底层执行依赖默认的 `Baki` 实例，如果存在多个 `Baki` 实例，可以使用 `@Baki` 注解来指定接口底层具体依赖哪个 `Baki` 来执行：

```java
@Baki("slaveBaki")
@XQLMapper("example-x")
public interface ExampleXMapper {
  ...
```

直接注入接口即可执行相应的操作：

```java
public class HomeService {
    final ExampleXMapper exampleXMapper;

    public HomeController(ExampleXMapper exampleXMapper) {
        this.exampleXMapper = exampleXMapper;
    }
    ...
```

> 具体配置说明参考文档 [XQL 接口映射](documents/xql-interface-mapping) 。

## 事务

兼容 Spring 的事务注解 `@Transactional` ，或者使用 `Tx` 手动事务。

```java
@Service
public class MyService {

    @Autowired
    Baki baki;
  	
    // com.github.chengyuxing.sql.spring.autoconfigure.Tx
  	@Autowired
  	Tx tx;

    @Transactional
    public void a() {
        ...
    }
  
  	public void b(){
      tx.using(()->{
        ...
      });
    }
}
```

