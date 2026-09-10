# SQL 执行扩展点

Rabbit SQL 提供了几个执行阶段的扩展接口，用于拦截、监听和定制 SQL 执行。

## SqlInterceptor

在 SQL 真正执行前拦截，可以修改 SQL，或抛出异常拒绝执行：

```java
bakiDao.setSqlInterceptor((rawSql, parsedSql, args, databaseInfo) -> {
    if (parsedSql.toLowerCase().contains("drop table")) {
        throw new IllegalStateException("禁止执行 DROP TABLE");
    }
    return parsedSql;
});
```

参数：

- `rawSql`：原始 SQL 引用或 SQL 内容。
- `parsedSql`：解析后的 SQL 内容。
- `args`：参数字典。
- `databaseInfo`：当前数据库信息。

## AroundExecutor

`executionWatcher` 用于在 SQL 执行前后插入逻辑，例如记录日志、统计耗时：

```java
bakiDao.setExecutionWatcher(new AroundExecutor<>() {
    @Override
    protected void before(ExecutionContext context) {
        context.setState("start", System.currentTimeMillis());
    }

    @Override
    protected void after(ExecutionContext context, Throwable throwable) {
        long start = context.getState("start");
        long cost = System.currentTimeMillis() - start;
        System.out.printf("[%s] %s cost=%dms%n", context.getType(), context.getSql(), cost);
    }
});
```

`ExecutionContext` 提供：

- `getType()`
- `getSql()`
- `getArgs()`
- `getResult()` / `setResult()`
- `setState(key, value)` / `getState(key)`

## SqlInvokeHandler

用于处理 SQL 执行结果，按 SQL 类型返回不同的处理器：

```java
bakiDao.setSqlInvokeHandler(type -> (baki, method, args) -> {
    Object result = method.invoke(baki, args);
    // 统一记录或转换结果
    return result;
});
```

## QueryTimeoutHandler

根据 SQL 和参数动态设置 JDBC 查询超时时间：

```java
bakiDao.setQueryTimeoutHandler((sql, args) -> {
    if (sql.startsWith("&report")) {
        return 60;
    }
    return 5;
});
```

返回值为秒，`0` 表示不设置超时。

