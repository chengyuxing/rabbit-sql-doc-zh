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

内置 JPA 实体映射已移除，请通过 `EntityMetaProvider` 自行适配，参考 [实体兼容 JPA 等其他框架](guides/advanced-jpa)。

## 更多历史变更

完整变更记录见 [变更日志](documents/changes)。

