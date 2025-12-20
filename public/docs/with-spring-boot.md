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
    <version>5.1.3</version>
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

通过实现 BakiDao 中的**接口属性**来自动注入到到 BakiDao 中，可以使用 @Component 或 @Bean 的方式来替代 starter 的默认值，如下：

```java
@Component
public class RedisCacheManager implements QueryCacheManager {
    final RedisTemplate<Object, Object> redisTemplate;
  
    public RedisCache(RedisTemplate<Object, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
  
    @Override
    public @NotNull Stream<DataRow> get(@NotNull String sql, Map<String, ?> args, @NotNull RawQueryProvider provider) {
       ...
    }
```

支持自动注入的 Bean 有：

- QueryCacheManager
- XQLFileManager
- SqlInterceptor
- PageHelperProvider
- StatementValueHandler
- ExecutionWatcher
- QueryTimeoutHandler
- EntityManager.EntityMetaProvider
- SqlInvokeHandler

### 打印 SQL 日志

`application.yml`

```yaml
logging:
  level:
    root: info
    # 配置打印 SQL 日志
    com.github.chengyuxing: debug
```

## 注入

最直观的方式也就是注入 `Baki` 接口即可执行数据库访问操作，也是最灵活的方式，但框架也提供了 XQL 接口映射的方式，用过 MyBatis 的小伙伴一点都不会陌生。

### Baki 核心接口

```java
@Autowired
Baki baki;
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
