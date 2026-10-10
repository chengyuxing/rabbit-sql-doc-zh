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

确认使用 rabbit-common `3.2.14` 和 Rabbit SQL `{{rabbitSqlVersion}}`，且属性具有 JavaBean getter/setter 与对应字段。字段支持多层继承和子类重写 getter，但计算属性或仅声明字段的实体不会自动映射。子类同名字段覆盖父类字段，注解应标在实际采用的字段上。

## 实体元数据或主键校验失败

确认提供者返回非空表名、列名，列名没有重复，且恰好标记一个主键。默认提供者不会自动识别 `@Id`；JPA 实体需配置适配器。手动主键插入及按主键更新要求主键非空；没有可更新列的实体不能更新。

## 批处理提示 SQL 结构不同

检查各行参数是否导致 `#if` 选择不同列、`#for` 生成不同数量的占位符。按最终 SQL 结构分组或逐条执行。此前分批可能已经执行，整批回滚需要事务，详见 [批量操作](documents/best-practice-performance)。

## 插件仍使用旧管道实现

先编译项目，再重载当前激活配置，确认 Maven / Gradle 编译输出存在且包含管道类及其依赖。保存已注册的 `.xql` / `.sql` 只刷新 SQL 资源，不能代替 Java 编译。

## XQL 重载失败

重载失败后保留上次成功的资源与管道。检查配置、文件语法及管道类加载错误，修正后重新初始化；不要把“还能读取旧 SQL”误认为新配置已生效。


## 查询实体后调用 toInstant 或更新时抛出异常

实体声明为 `java.util.Date`，查询值的运行时类型可能是 `java.sql.Date` 或 `java.sql.Time`；它们继承了 `Date`，但不支持 `toInstant()`。rabbit-common `3.2.14` 的公共转换会在目标为 `Date` 时复制为普通 `Date`，Rabbit SQL `{{rabbitSqlVersion}}` 的 JDBC 绑定也会分别处理 SQL 日期、时间和时间戳。

自定义 `EntityMetaProvider.columnValue` 时调用 `ValueUtils.adaptValue(field.getType(), value)`。字段显式声明为 SQL `Date` 或 `Time` 时仍保留 SQL 类型，需要时显式适配到普通 `Date` 或 `Instant`。普通 `Date` 为毫秒精度，纳秒需求使用 `Timestamp` 或支持纳秒的 Java 时间类型。

## 日期字符串转换现在报错

如果输入是 `2026-10-10 10:35:57.672+08`，确认使用 rabbit-common `3.2.14`、Rabbit SQL `{{rabbitSqlVersion}}` 或 Starter `{{starterVersion}}`；显式锁定 common 依赖时也需同步升级。旧版完整解析未识别空格分隔的带偏移时间，新版会正确保留偏移并解析为 `2026-10-10T02:35:57.672Z`。不要删掉 `+08`，否则会改为按系统默认时区解释。`of` 的文本提取及 `+08:30` 偏移截断也已修复。


公共转换改用 `MostDateTime.parse(String)` 完整校验，不会接受未识别的前后缀，也不会自动修正非法日期。检查输入格式；确实需要从文本提取日期时，显式调用 `MostDateTime.of(String)`。旧的无参 `toZonedDateTime()` 调用迁移到 `toLocalDateTime()`，带时区结果使用 `getZonedDateTime()`，详见 [实用工具](guides/utils)。

## SQL 高亮缺少分号、换行或误判字符串内容

Rabbit SQL `{{rabbitSqlVersion}}` 的 `SqlHighlighter` 直接扫描原文，修复末尾字符丢失、字符串占位符碰撞和字符串内注释误判。去除 ANSI 颜色后应与原 SQL 完全一致。

自定义高亮使用三参数 `highlight(sql, commentStyleCleaner, replacer)`。dollar quoted 片段整体以 `QUOTE_STRING` 传入；RabbitScript 等特殊注释保留内部表达式配色。回调抛出异常时会返回完整原文。方法和标签说明见 [实用工具](guides/utils)。
