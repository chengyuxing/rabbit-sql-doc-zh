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

## 升级到 10.3.20

本次版本组合为 Rabbit SQL `{{rabbitSqlVersion}}`、rabbit-common `3.2.12`、Starter `{{starterVersion}}` 和插件 `2.4.63.231-263`。发布 Maven 构件时依次发布 common、SQL、Starter；升级 Starter 可带入相应 SQL 依赖，显式锁定旧版本的项目需同步更新。

升级前检查以下行为：

- 内置 `Tx` 不再容忍嵌套调用；同线程已有事务时立即报错，事务传播需求交给 Spring 管理。
- 实体 CRUD 的复合主键、重复列名、空表名和空列名会明确报错；`NONE` 插入和按主键更新的空主键会被拒绝。没有可更新列的实体仍可查询、插入和删除。
- 动态批处理每行的预编译 SQL 必须一致，结构不同请分组或逐条执行；需要整体回滚时使用事务。
- `File` / `Path` 参数绑定会将文件读入内存，大文件请使用外层管理生命周期的 `InputStream`。
- 页码、每页条数、批量大小须为正数，超出分页支持范围的参数会报错。
- 替换 `EntityMetaProvider` 后重新获取实体执行器；Mapper 的 `default` 方法仍不支持。

完整修复说明见 [变更日志](documents/changes)。
