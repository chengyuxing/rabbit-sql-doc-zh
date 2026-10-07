# 故障排查

## 惰性查询导致连接池耗尽

`stream()` 返回的 `Stream` 内部持有 JDBC `Connection`，使用后必须关闭。

```java
try (Stream<DataRow> stream = baki.query("...").stream()) {
    // 处理结果
}
```

## Spring 环境内置事务不生效

Spring Boot 中使用 Starter 后，请使用 Spring 事务或 `com.github.chengyuxing.sql.spring.autoconfigure.Tx`。

不要使用 `com.github.chengyuxing.sql.transaction.Tx`。

## 动态 SQL 解析报错

检查指令是否独立成行、`#if` / `#fi` 是否成对、`#for` / `#done` 是否成对，以及管道名是否已注册。

## XQL 文件分号解析异常

每个 SQL 对象以单个 `;` 分隔。如果存储过程或 PLSQL 内部包含多个 `;`，请在需要保留的分号后追加行注释 `--`：

```sql
begin;
  select 1; --
  select 2; --
end;
```

## IDEA 插件无法识别项目

确认是标准 Maven 项目，且存在 `src/main/resources` 目录。非 Maven 项目需要手动创建该目录。

## 多数据源注入冲突

如果存在多个 `Baki` 实例，接口映射时可以使用 `@Baki("beanName")` 指定使用哪个实例。

## 分页 SQL 不符合预期

确认当前数据库是否有内置分页实现。没有时，通过 `globalPageHelperProvider` 或单条查询的 `pageHelper(...)` 提供自定义实现。

## 继承实体找不到父类字段

确认使用 rabbit-common `3.2.12` 和 Rabbit SQL `{{rabbitSqlVersion}}`，且属性具有 JavaBean getter/setter 与对应字段。字段支持多层继承和子类重写 getter，但计算属性或仅声明字段的实体不会自动映射。子类同名字段覆盖父类字段，注解应标在实际采用的字段上。

## 实体元数据或主键校验失败

确认提供者返回非空表名、列名，列名没有重复，且恰好标记一个主键。默认提供者不会自动识别 `@Id`；JPA 实体需配置适配器。手动主键插入及按主键更新要求主键非空；没有可更新列的实体不能更新。

## 批处理提示 SQL 结构不同

检查各行参数是否导致 `#if` 选择不同列、`#for` 生成不同数量的占位符。按最终 SQL 结构分组或逐条执行。此前分批可能已经执行，整批回滚需要事务，详见 [批量操作](documents/best-practice-performance)。

## 插件仍使用旧管道实现

先编译项目，再重载当前激活配置，确认 Maven / Gradle 编译输出存在且包含管道类及其依赖。保存已注册的 `.xql` / `.sql` 只刷新 SQL 资源，不能代替 Java 编译。

## XQL 重载失败

重载失败后保留上次成功的资源与管道。检查配置、文件语法及管道类加载错误，修正后重新初始化；不要把“还能读取旧 SQL”误认为新配置已生效。
