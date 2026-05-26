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

事务的使用请遵循线程的隔离性。

注意：如果在 Spring Boot 中引入了依赖 `rabbit-sql-spring-boot-starter` 进行自动配置，`Tx` 的所有方法都不起作用，请使用 Spring Boot 的事务，参考文档 [集成 Spring Boot](documents/with-spring-boot) 。