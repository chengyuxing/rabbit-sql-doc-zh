# 框架变更日志

- ⚠️ Rabbit SQL 从 `10.0.0` 开始，将只维护一个版本，默认支持最低 JDK 为 1.8，对于 Starter 的支持 Springboot 最低兼容版本为 2.7（JDK 1.8）。

- ❌ 移除了对于内置 JPA 实体映射的支持，转而采用更灵活的映射接口扩展来支持自定义实现：

  - `EntityFieldMapper` ✅
  - `EntityValueMapper` ✅

- ❌ 移除了 `SaveExecuter` 、 `EntityExecuter` 、`GenericExecutor`。
- ✅ Baki 重新调整，增加一级接口 `insert`、`update`、`delete ` 、`execute` 、 `call` 。
- ✅ BakiDao 增加 `ExecutionWatcher` 属性，支持更灵活的 SQL 执行监听操作。
- ❌ BakiDao 移除 `SqlWatcher` 属性。
- ✅ PageHelper 增加方法 `countSql` ，支持重写专有的内置条数查询语句。
