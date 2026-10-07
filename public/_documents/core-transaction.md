# 事务

通过静态类：`com.github.chengyuxing.sql.transaction.Tx` 来使用事务：

- `begin()`

- `commit()`

- `rollback()`

- `using(func)` ：自动开始事务，正常提交，异常回滚：

  ```java
  Tx.using(() -> {
    ......
  });
  ```

事务使用应遵循线程隔离原则。

注意：如果在 Spring Boot 中引入了依赖 `rabbit-sql-spring-boot-starter` 进行自动配置，`Tx` 的所有方法都不起作用，请使用 Spring Boot 的事务，参考文档 [集成 Spring Boot](documents/spring-boot) 。

## 生命周期与使用边界

内置 `com.github.chengyuxing.sql.transaction.Tx` 的事务状态只属于当前线程，不会传播到异步任务。同一线程已有事务时再次调用 `begin()` 或 `using(...)` 会抛出 `IllegalStateException`，不修改已有事务，也不执行内层回调。当前不支持嵌套事务或保存点；Spring 环境的事务传播由 Spring 管理。

`Tx.using(...)` 在业务成功时提交，业务失败时回滚。提交失败会尝试回滚并释放连接；业务异常优先保留，回滚和清理失败通过 suppressed exceptions 附加。某个连接清理失败时仍会继续清理其他已注册连接，并清除线程内事务状态。

批处理可能分多次调用 JDBC 执行。若整批要求成功或全部回滚，应在事务内执行：

```java
Tx.using(() -> {
    baki.execute("insert into guest(id, name) values (:id, :name)", rows);
});
```

多数据源的连接逐个提交，内置 `Tx` 不是 XA 或分布式事务，不能保证跨数据库原子性；一个连接已提交后，其他连接失败不能撤销此前提交。
