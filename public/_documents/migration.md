# 升级与迁移

本文列出从旧版本升级到当前版本时需要注意的破坏性变更。

## 事务 API

Spring Boot 环境请使用：

```java
com.github.chengyuxing.sql.spring.autoconfigure.Tx
```

不要使用内置的：

```java
com.github.chengyuxing.sql.transaction.Tx
```

## 移除的简单 DML 方法

旧版 `Baki#insert`、`Baki#update`、`Baki#delete` 已移除，请统一使用 `Baki#execute`：

```java
baki.execute("insert into test.user(name) values (:name)", Args.of("name", "cyx"));
baki.execute("update test.user set name = :name where id = :id", args);
baki.execute("delete from test.user where id = :id", args);
```

## 执行监听器

`ExecutionWatcher` 已改为 `AroundExecutor<ExecutionContext>`，相关方法也由 `onStart` / `onStop` 调整为 `before` / `after`。

## 命名参数前缀位置

`namedParamPrefix` 已从 `BakiDao` 移到 `XQLFileManager` 作为全局配置。

## 实体映射

内置 JPA 注解适配已移除。当前有按类简单名、字段名及值类型适配的默认 `EntityMetaProvider`，但不解析 JPA 注解，也不会自动标记主键；JPA 注解需要自行适配，参考 [实体兼容 JPA 等其他框架](guides/advanced-jpa)。

## 更多历史变更

完整变更记录见 [变更日志](documents/changes)。

## 升级到 10.3.22

版本组合为 Rabbit SQL `10.3.22`、rabbit-common `3.2.14`、Starter `5.3.23` 和插件 `2.4.65.231-263`。发布 Maven 构件时依次发布 common、SQL、Starter；项目显式锁定核心依赖版本时需同步更新。

- 数据库中的 `2026-10-10 10:35:57.672+08` 等合法时间文本可直接通过 `ValueUtils.adaptValue` 映射；无需将空格手动改为 `T`，也不要删除偏移量。
- `MostDateTime.of` 从文本提取时间时会使用显式偏移确定时刻。旧版忽略偏移或将 `+08:30` 截成 `+08` 的结果可能变化，这是时区解析修复。
- `parse` 与公共类型转换继续完整校验；格式兼容在解析器内部完成，不会在失败后退回 `of`。业务确实需要从描述性文本提取时间时，显式使用 `of`。

完整格式与映射示例见 [实用工具](guides/utils) 和 [实体操作](documents/core-entity)。

## 升级到 10.3.21

版本组合为 Rabbit SQL `10.3.21`、rabbit-common `3.2.13`、Starter `5.3.22` 和插件 `2.4.64.231-263`。发布 Maven 构件时依次发布 common、SQL、Starter；项目显式锁定核心依赖版本时需同步更新。

- 日期和时间字符串转换使用 `MostDateTime.parse(String)` 校验完整输入；非法日期、未识别的前后缀会报错，需要从文本提取日期时改用 `MostDateTime.of(String)`。
- 纯时间使用其所属时区的今天；显式传入 `of(Temporal, ZoneId)` 的时区表示目标时区，不传时区时保留输入已有的时区。
- 旧的无参 `toZonedDateTime()` 已更名为 `toLocalDateTime()`，原调用需要修改；需要带时区的结果时使用 `getZonedDateTime()`。静态的 `MostDateTime.toZonedDateTime(String)` 仍提供文本提取。
- `java.util.Date` 字段会得到普通 `Date`，保留毫秒值；需要纳秒精度时使用 `Timestamp` 或支持纳秒的 Java 时间类型。查询实体后可直接更新，无需自行复制 SQL 日期子类。
- 新增 `entity(...).findById(id)`；`query(queryId)` 的参数仍是查询标识。
- SQL 高亮将 dollar quoted 内容作为完整字符串处理；自定义 `SqlHighlighter` 回调会以 `QUOTE_STRING` 接收整个 dollar quoted 片段。

## 升级到 10.3.20

本次版本组合为 Rabbit SQL `10.3.20`、rabbit-common `3.2.12`、Starter `5.3.21` 和插件 `2.4.63.231-263`。发布 Maven 构件时依次发布 common、SQL、Starter；升级 Starter 可带入相应 SQL 依赖，显式锁定旧版本的项目需同步更新。

升级前检查以下行为：

- 内置 `Tx` 不再容忍嵌套调用；同线程已有事务时立即报错，事务传播需求交给 Spring 管理。
- 实体 CRUD 的复合主键、重复列名、空表名和空列名会明确报错；`NONE` 插入和按主键更新的空主键会被拒绝。没有可更新列的实体仍可查询、插入和删除。
- 动态批处理每行的预编译 SQL 必须一致，结构不同请分组或逐条执行；需要整体回滚时使用事务。
- `File` / `Path` 参数绑定会将文件读入内存，大文件请使用外层管理生命周期的 `InputStream`。
- 页码、每页条数、批量大小须为正数，超出分页支持范围的参数会报错。
- 替换 `EntityMetaProvider` 后重新获取实体执行器；Mapper 的 `default` 方法仍不支持。

完整修复说明见 [变更日志](documents/changes)。
