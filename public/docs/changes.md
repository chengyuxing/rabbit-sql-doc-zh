# 框架变更日志

## 10.2.5

- `XQLFileManager` 增加支持 SQL 对象定义元数据 `-- @name value` ，通过 `Sql#getMetadata` 获取，例如：
  ```sql
  /*[queryUsers]*/
  -- @cache 30m
  -- @rules admin,guest
  select * from users;
  ```
- IDEA 插件更新版本 `2.4.42` ，支持 Live template：
  - `xql:metadata`
  - `xql:new-inline-template`

## 10.2.4

### FOR 指令语法变更

动态 SQL `#for` 指令语法调整，最新的语法结构为：
```sql
#for item of :list [| pipe1 | pipeN | ... ] [;index as i] [;last as isLast] ...
...
#done
```
- ❌ 移除关键字：`delimiter` , `open` , `close`
- ✅ 增加关键字：`as`
- ✅ 增加上下文属性变量：`index` , `first` , `last` , `odd` , `even` 使用 `as` 关键字创建变量引用别名
- ✅ `rabbit-sql-spring-boot-starter` 最新支持版本 `5.2.4`

### XQL 管理器

- ✅ `XQLFileManager` 增加支持内联模版解析，其他 SQL 可根据名字直接引用，避免单独提取为模版片段对象：
  ```sql
  -- //TEMPLATE-BEGIN:<name> 
  ... 
  -- //TEMPLATE-END
  ```
  内联模版不可嵌套，且必须成对，如下例子：
  ```sql
  /*[queryList]*/
  select * from guest where
  -- //TEMPLATE-BEGIN:myInLineCnd
  -- #if :id
  id = :id
  -- #fi
  -- //TEMPLATE-END
  ;
  
  /*[queryCount]*/
  select count(*) from guest where ${myInLineCnd};
  ```
- ✅ 动态 SQL 布尔条件判断支持单目语法：`!:isAlien` ，等效于 `:isAlien == false`
- ✅ 动态 SQL 脚本引擎逻辑优化，增加支持动态 SQL 编译缓存
- ✅ 路径表达式解析优化
- ✅ IDEA [插件](https://plugins.jetbrains.com/plugin/21403-rabbit-sql/)最低版本支持：`2.4.41`

## 10.2.3

- 修复动态 SQL `#for` 指令循环体命名参数解析 BUG
- 动态 SQL 词法分析解析字符串安全优化

## 10.2.2

- ✅ `StringUtils#isNumber` 优化判断
- ✅ 对象路径表达式支持下标取值语法 `[]` ，例如：`user.addresses[0].name`
- ✅ `XQLFileManager` 解析文件优化
- ⚠️ 属性命名参数前缀 `namedParamPrefix` 从 `BakiDao` 中移到 `XQLFileManager` 作为全局配置项
- ✅ `StringUtils#isNonNegativeInteger` 非负整数判断优化
- ✅ `ValueUtils#getDeepValue` 性能优化
- ✅ 动态 SQL 解析词法分析优化
- ❌ `XQLFileManager` 移除属性 `databaseId`

## 10.2.1

- ✅ 新增标识符：`Baki#identifier`
- ✅ `Baki#entity.query` 第一个可选参数作为查询 ID 带入参数中，可通过 `Baki#identifier` 获取，为根据参数拦截 SQL 提供帮助
- ✅ XQL 接口映射参数解析优化
- ✅ SQL 异常拦截统一包装为：`com.github.chengyuxing.sql.exceptions.DataAccessException`
- ✅ Spring boot starter (5.2.1) 实现 SQL 异常翻译对接到 Spring 的 `DataAccessException`，支持拦截如 `DuplicateKeyException` 等
- ⚠️ 包名 `com.github.chengyuxing.sql.utils` 重命名为 `com.github.chengyuxing.sql.util`
- ⚠️ 包名 `com.github.chengyuxing.common.utils` 重命名为 `com.github.chengyuxing.common.util`
- ⚠️ 重命名以及性能优化：
  - `JdbcUtil` -> `JdbcUtils`
  - `Sqlutil` -> `SqlUtils`
  - `XQLMapperUtil` -> `XQLMapperUtils`
  - `StringUtil` -> `StringUtils`
  - `ObjectUtil` -> `ValueUtils`
  - `ReflectUtil` -> `ReflectUtils`
- ✅ 新增工具类：`NamingUtils`
- ⚠️ 实体映射解析逻辑调整以符合 Java Bean 规范，从找字段改为找属性，例如：`getName` -> `name`
- ✅ 新增方法：`DataRow#deepGetAs`
- ❌ 移除：`ImmutableList`
- ✅ `MostDateTime` 新增识别时间字符串格式：
  - `yyyyMMddHHmmssSSS`
  - `yyyy[-/]MM[-/]dd HH:mm:ss.[SSS|ffffff|nnnnnnnnn]`
- ✅ 动态 SQL 解析性能优化

## 10.1.2

- ✅ 实体操作 `insert` 优化了对主键为null的约束判断

## 10.1.1

- ✅ 实体查询增加方法：`query#select(...)` 可选择字段
- ❌ 移除了实体解析内置的默认实现：`EntityMetaProvider`

## 10.1.0

- ✅ 新增简单实体操作接口方法：`Baki#entity`
- ✅ 新增实体解析通用接口：`EntityMetaProvider`
- ❌ 移除接口：`EntityValueMapper` ，`EntityFieldMapper`
- ✅ Spring boot starter (5.1.1) 增加自动配置 Bean：`EntityMetaProvider`

## 10.0.9

- ✅ Baki 批量修改操作接口参数新增支持实体集合映射到Map函数：
  ```java
  <T> int insert(@NotNull String sql, @NotNull Iterable<T> data, @NotNull Function<T, ? extends Map<String, ?>> argMapper);
  ```

## 10.0.8

- ⚠️ `Baki#insert` 一级接口第一个参数表名改为传入完整sql
- ✅ 新增方法 `Baki#table` 支持根据数据对单表生成简单 `insert, update, delete` 语句执行（批量）修改操作

## 10.0.7

- ⚠️ 查询缓存管理器重构优化，内部取消同步锁，更新和获取机制完全由接口实现控制：
  ```java
  @NotNull Stream<DataRow> get(@NotNull String sql, Map<String, ?> args, @NotNull RawQueryProvider provider);
  ```
- ✅ XQL 映射拦截注入接口重构优化，提高自由度
- ❌ Spring boot starter (5.0.8) 自动配置移除了多数据源配置项
- ✅ Spring boot starter (5.0.8) 默认单数据源自动注入配置优化，`BakiDao` 中所有接口对象类型属性都支持自动配置（`@Bean` 或 `@Component`），例如：
  ```java
  @Component
  public class RedisCacheManager implements QueryCacheManager {
      final RedisTemplate<Object, Object> redisTemplate;
      ...
  }
  ```
  缓存管理器将自动注入到 Baki 中

## 10.0.6

- ✅ 兼容 spring boot 4.0
- ⚠️ 移除了 `SqlParseChecker`，功能迁移到 `SqlInterceptor`
- ✅ `BakiDao` 内置分页查询优化，sql名解析为条数查询和记录查询语句优化

## 10.0.5

- ✅ 一些内部优化

## 10.0.4

- ✅ 管道参数增加支持变量，例如：`:a | plus(:b)`
- ✅ `#switch` 的 `#case` 支持变量
- ✅ 动态 SQL `#var` 定义变量支持出现在 `#for` 循环内作为局部变量
- ✅ 动态 SQL `#for` 解析逻辑优化
- ✅ 动态 SQL 强制用户参数和 `#var` 变量定义不能重复

## 10.0.3

- ❌ `XQLFileManager` 移除字段 `delimiter` ，内部重新优化解析逻辑，强制以单个 `;` 分割每个 SQL 对象，若 SQL 对象为过程语句包含多段 SQL，则在分号结尾使用行注释 `--` 来防止被提前截断，例如：
   ```sql
   /*[plsql]*/
   begin
    select 1;--
    select 2;--
   end;
   ```
- ❌ 字符串模版 `${}` 解析优化，移除 `TemplateFormatter` , `NamedParamFormatter`
- ✅ 动态 SQL 解析参数覆盖逻辑调整：用户参数覆盖内部 `#var` 定义的参数
- ✅ `PagedResource` 增加方法：`to`

## 10.0.2

- ✅ 动态 SQL 新增管道 `in`
- ✅ `ClasspathResource` 内部优化。

## 10.0.1

- ✅ 动态 SQL 流程控制语句增加支持守卫语句，如果条件满足则执行分支处理逻辑，否则执行 `#throw` 抛出异常信息并终止后面的所有操作。
  ```sql
  -- #guard :id > 0
  ...
  -- #throw 'message'
  ```
- ✅ 动态 SQL 支持前置条件检查语句，如果条件满足，则抛出异常：
  ```sql
  -- #check :id == null throw 'message'
  ```
- ✅ 动态 SQL 支持变量定义语句，并可以在 SQL 参数中使用变量：
  ```sql
  -- #var newId = :id
  -- #var list = 'a,b,c' | split(',')
  ```
- ✅ 管道支持不定长参数，例如：`split(',')` ，如果没有参数，不需要加括号。
- ✅ 内置管道增加：`split` , `nvl` , `type` 。
- ❌ 移除管道：`pairs` 。
- ✅ 动态 SQL 解析抛出异常增加具体的位置行号列号。
- ✅ 查询缓存管理器 `get` 方法增加第二个参数，SQL 执行期间的参数字典：
  ```java
  Stream<DataRow> get(String uniqueKey, Map<String, ?> args);
  ```
- ✅ 修复执行 oracle pl/sql 语句导致 `end` 结尾分号被去掉的问题。

## 10.0.0

- ⚠️ Rabbit SQL 从 `10.0.0` 开始，将只维护一个版本，默认支持最低 JDK 为 1.8，对于 Starter 的支持 Springboot 最低兼容版本为 2.7（JDK 1.8）
- ❌ 移除了对于内置 JPA 实体映射的支持，转而采用更灵活的映射接口扩展来支持自定义实现：
  - ✅ `EntityFieldMapper` 
  - ✅ `EntityValueMapper` 
- ❌ 移除了 `SaveExecuter` 、 `EntityExecuter` 、`GenericExecutor`。
- ✅ Baki 重新调整，增加一级接口 `insert`、`update`、`delete ` 、`execute` 、 `call` 。
- ✅ BakiDao 增加 `ExecutionWatcher` 属性，支持更灵活的 SQL 执行监听操作。
- ❌ BakiDao 移除 `SqlWatcher` 属性。
- ✅ PageHelper 增加方法 `countSql` ，支持重写专有的内置条数查询语句。
