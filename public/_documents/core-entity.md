# 实体操作与 DSL 查询

Rabbit SQL 支持简单的单表实体操作，通过 `Baki#entity(Class)` 使用。

## 准备实体元数据

默认 `EntityMetaProvider` 使用类的简单名作为表名、字段名作为列名，并适配查询结果值的类型。它不识别 JPA 注解，也不会自动指定主键。单表 CRUD 需要实现 `com.github.chengyuxing.sql.EntityManager.EntityMetaProvider`，配置到 `BakiDao#entityMetaProvider`，并明确标记一个主键。

核心方法是：

- `tableName(Class<?> clazz)`：解析表名。
- `columnMeta(Field field)`：解析列约束。
- `columnValue(Field field, Object value)`：转换数据库值。

详细适配 JPA 注解的示例见 [实体兼容 JPA 等其他框架](guides/advanced-jpa)。

实体属性通过 JavaBean getter/setter 与对应字段识别。字段沿继承链查找，子类同名字段优先；子类重写 getter 时仍能找到父类字段及其注解。布尔 getter 可使用 `Guest::isActive`。没有对应字段的计算属性不参与映射，仅声明字段而没有 JavaBean 访问方法的实体不会自动映射。

实体 CRUD 要求恰好一个主键，不支持复合主键。空表名、空列名和重复映射列名会在元数据初始化时被拒绝。只有主键或没有可更新列的实体可以查询、插入、删除，更新操作会报错。

建议在首次使用前完成提供者配置。更换 `EntityMetaProvider` 会清除缓存，但已经取得的实体执行器仍持有原元数据，需要重新调用 `baki.entity(...)` 获取。

## 按主键查询一条记录

`EntityExecutor.findById(id)` 根据提供者标记的单一主键查询，返回 `Optional<T>`：

```java
Optional<Guest> guest = baki.entity(Guest.class).findById(42L);
guest.ifPresent(value -> {
    value.setAddress("Kunming");
    baki.entity(Guest.class).update().save(value);
});
```

主键列取自实体元数据，适配器可以提供 JPA 的 `@Id`、`@Column` 或其他框架规则，支持继承字段及自定义列名。ID 使用预编译参数绑定，不能为 `null`；未匹配记录时返回 `Optional.empty()`。

`query(queryId)` 的参数仍是查询标识，不会生成主键条件。按主键查一条记录使用 `findById(id)`；组合查询条件使用下方的 `query().where(...)`。

## 按主键判断存在与删除（10.3.24 起）

```java
boolean present = baki.entity(Guest.class).existsById(42L);
int deleted = baki.entity(Guest.class).deleteById(42L);
```

这两个方法与 `findById` 使用同一主键元数据，支持继承属性和自定义列名，并使用预编译参数绑定。`null` 主键会报错；记录不存在时分别返回 `false` 和 `0`。删除不需要先查询或构造实体。

`existsById` 只查询常量并限制最多一行，不执行计数查询或实体映射。`existsById` 与后续插入、更新是独立操作，不能用“先判断再写入”替代数据库唯一约束或并发控制。

## 查询

```java
List<Guest> guests = baki.entity(Guest.class)
    .query()
    .where(w -> w.gt(Guest::getId, 5)
                 .and(o -> o.in(Guest::getId, List.of(17, 18, 19))
                            .eq(Guest::getId, 10)))
    .orderBy(o -> o.desc(Guest::getId))
    .list();
```

可用的查询终态方法：

- `stream()`
- `list()`
- `top(n)`
- `findFirst()`
- `pageable(page, size)`
- `count()`
- `exists()`（10.3.24 起）
- `forEach(consumer)`

条件存在性查询（10.3.24 起）：

```java
boolean present = baki.entity(Guest.class)
    .query()
    .where(w -> w.eq(Guest::getAddress, "Kunming"))
    .exists();
```

不加 `where` 时判断表中是否存在记录。`exists()` 复用当前条件，忽略 `select` 和用户指定的排序，不改变查询对象的配置，也不加载实体或执行 `count()`。它使用现有数据库分页适配限制一行，并在结束时关闭查询资源；SQL Server 的分页语法需要内部按主键排序。自定义数据库需提供对应的 `PageHelper`。

## 插入

```java
baki.entity(Guest.class)
    .insert()
    .save(guest);
```

批量插入：

```java
baki.entity(Guest.class)
    .insert()
    .save(guests);
```

`NONE`（手动主键）策略要求在所有插入入口显式提供非空主键；`IDENTITY` 策略由数据库生成主键，插入时不包含主键列。框架不会自动把生成的主键回填到实体。仅有 `IDENTITY` 主键的实体生成 `insert ... default values`，使用前请确认数据库支持该语法。

默认会忽略 `null` 字段。如需保留 `null` 并走 JDBC 批量执行：

```java
baki.entity(Guest.class)
    .insert()
    .withNullValues()
    .save(guests);
```

插入时通过 `.set(...)` 指定字段，同一字段最后一次赋值生效，`save()` 不会重新覆盖为初始值。

## 映射失败的定位信息

rabbit-common `3.2.15` 会在查询值转换或 setter 调用失败时，说明实体类、属性、来源列名、来源值类型、目标类型及 setter。异常类型为 `IllegalStateException`，原始转换或 setter 异常保留在 `getCause()`；继承字段及自定义列名同样适用。

实体转 Map 时调用 getter 失败，也会说明实体、属性、列名及 getter，并保留原始原因。排查顺序和示例见 [故障排查](documents/troubleshooting)。

## 枚举字段（10.3.24 起）

枚举默认按 `name()` 写入字符串列，查询时按常量名称恢复；重写 `toString()` 不影响存储值。名称区分大小写，不会自动去除空白，也不会根据显示文本匹配枚举。

```java
enum Status { ACTIVE, BLOCKED }

// 默认存为 "ACTIVE" 或 "BLOCKED"
private Status status;
```

字段仍需提供 JavaBean getter/setter。实体单条/批量增删改、`only`/`exclude`、显式 `set` 和 `where` 中的枚举值保持一致，包括 `in`、`between` 和嵌套条件。数字列可按合法整数序号恢复枚举；小数、越界序号和未知名称会报错。数字字符串不会自动按序号解释。

要按序号写入，在 `EntityMetaProvider.columnMeta` 中设置 `columnMeta.setEnumerated(EntityManager.ColumnEnumType.ORDINAL)`；`STRING` 或未配置时按名称写入。JPA 的 `@Enumerated(STRING/ORDINAL)` 适配示例见 [JPA 适配](guides/advanced-jpa)。核心不直接读取 JPA 注解。优先使用名称存储，避免枚举常量顺序调整后旧序号含义改变。

原生 SQL 的参数没有实体字段元数据，枚举仍按 `name()` 绑定；需要序号时显式传入 `status.ordinal()`。数据库原生枚举类型的绑定仍按驱动需要配置 `StatementValueHandler`，不假定字符串绑定适用于所有原生枚举列。

## 布尔字段存储（10.3.24 起）

实体使用 `boolean` / `Boolean`、数据库使用数字 `0/1`、字符串 `"0"/"1"` 或 `"N"/"Y"` 时，可以在 `EntityMetaProvider.columnMeta(Field)` 配置 `ColumnMeta.booleanStorage`，统一处理读取和实体参数绑定：

```java
// varchar 存储 "0" / "1"
columnMeta.setBooleanStorage(EntityManager.BooleanStorage.ZERO_ONE_STRING);
```

数字列使用 `NUMERIC`，`"N"/"Y"` 字符串列使用 `YES_NO`。可通过用户自己的注解标记字段，完整示例见 [JPA 适配：布尔列存储](guides/advanced-jpa)。核心不要求使用 JPA 注解。

该配置覆盖单条/批量实体操作、显式 `set` 和 WHERE 参数；例如 `.eq(User::getEnabled, true)` 按上述配置绑定字符串 `"1"`。参数仍传布尔值，`false` 会正常写入；`null` 保持为空，默认更新跳过 `null`，`withNullValues()` 可显式清空。

配置仅适用于 `boolean` / `Boolean`，非法字段类型或存储值会报错。允许空值的列应使用 `Boolean`。未配置时保持原有行为；配置后的查询结果由框架按存储规则转换，不再调用该字段的提供者 `columnValue`。

## UUID 字段与主键

从 Rabbit SQL `10.3.23`、rabbit-common `3.2.15` 起，使用默认值转换或在 `columnValue` 中调用 `ValueUtils.adaptValue` 时，实体 UUID 属性可以接收 UUID 对象、标准 36 位或紧凑 32 位十六进制字符串。字段仍需提供 JavaBean getter/setter；主键仍需由元数据提供者标记，例如通过 JPA 适配器识别 `@Id`。

```java
UUID id = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
Optional<UuidGuest> guest = baki.entity(UuidGuest.class).findById(id);
```

UUID 参数使用 `setString` 写入标准 36 位字符串，文本列需能容纳 36 个字符。旧的 32 位文本主键虽然可以查询映射为 UUID，但直接按该 UUID 查询、更新、删除时绑定的是 36 位格式，需先统一存储格式。原生 UUID 列与二进制列的绑定按驱动定制，详见 [配置项](documents/core-api-config) 和 [升级与迁移](documents/migration)。

## 日期字段映射

声明为 `java.util.Date` 的字段会得到普通 `Date`，保留毫秒时间值。数据库返回 `java.sql.Date`、`Time` 或 `Timestamp` 时，公共转换会按字段声明类型适配，因此查询得到实体后可以调用 `toInstant()` 并直接执行更新。

自定义提供者的值转换可以复用公共入口，无需在 `columnValue` 中先判断 SQL 日期子类并手动复制：

```java
@Override
public Object columnValue(Field field, Object value) {
    return ValueUtils.adaptValue(field.getType(), value);
}
```

显式声明为 `java.sql.Date`、`Time`、`Timestamp` 的字段保留对应 SQL 类型；SQL `Date`、`Time` 本身不支持 `toInstant()`，需要时请显式适配到 `Date` 或 `Instant`。纳秒精度应使用 `Timestamp` 或支持纳秒的 Java 时间类型，普通 `Date` 只能保留毫秒。

从 rabbit-common `3.2.14` 起，VARCHAR 列中的合法 SQL 风格时间文本也可映射到日期或 Java 时间字段，例如 `2026-10-10 10:35:57.672+08` 对应 `2026-10-10T02:35:57.672Z`。偏移量会保留，无需在 `columnValue` 中删除 `+08` 或手动替换空格；公共入口会统一处理。新建表时仍建议用适合业务含义的数据库日期或时间类型。

日期和时间字符串转换完整校验输入，非法日期或未识别的前后缀会报错。转换规则见 [实用工具](guides/utils)，参数绑定规则见 [配置项](documents/core-api-config)。

## 更新

按主键更新要求实体主键非空，单个实体及集合入口均会校验：

```java
baki.entity(Guest.class)
    .update()
    .save(guest);
```

### 本次更新选择字段（10.3.24 起）

`only(...)` 表示只更新指定属性，`exclude(...)` 表示排除指定属性。两者都使用实体 getter 方法引用，支持继承属性和 `@Column(name = "...")` 映射，不需要填写数据库列名。单个实体与批量更新共用相同的调用方式。

只更新指定字段：

```java
baki.entity(Guest.class)
    .update()
    .only(Guest::getAddress)
    .save(guest);

// 批量只更新 address；null 值也写入数据库，可用于清空字段
baki.entity(Guest.class)
    .update()
    .only(Guest::getAddress)
    .withNullValues()
    .save(guests);
```

排除指定字段：

```java
// 单个实体：保留数据库中原来的 address
baki.entity(Guest.class)
    .update()
    .exclude(Guest::getAddress)
    .save(guest);

// 批量：每个实体都排除 address，其余可更新字段允许写入 null
baki.entity(Guest.class)
    .update()
    .exclude(Guest::getAddress)
    .withNullValues()
    .save(guests);
```

字段选择配置只属于当前 `Update` 对象，同一种方法重复调用会累加，重复字段自动去重；复用该对象时规则仍然生效。新建 `update()` 对象不继承之前的配置，也不会修改共享实体元数据。

`only` 与 `exclude` 互斥：已经配置其中一种，再调用另一种时立即抛出异常，不按调用顺序覆盖或合并规则。`only` 至少需要一个可更新属性，指定主键、`updatable = false` 或未映射属性会报错，校验失败不改变已有配置。未配置 `only` 时，空参数的 `exclude()` 保持原配置不变。

需要局部更新时优先使用 `only`，这样实体以后新增属性也不会自动进入本次更新。

默认仍跳过 null 值；启用 `withNullValues()` 后，仅本次选中的可更新字段允许写入 null，批量时使用 JDBC batch。`@Column(updatable = false)` 等原有约束继续生效。即使排除主键属性，也只是从 `SET` 候选中排除，主键仍用于 `WHERE` 定位且必须非空。

排除后没有可更新字段时，单条返回 `0`，批量每条对应一个 `0`，不执行更新 SQL。实体本身没有可更新列时仍按原有规则报错。引用未映射属性会报错；`only` 和 `exclude` 仅用于按主键 `save(entity)` / `save(entities)`，与下面的 `where().set()` 混用会在执行时被拒绝。按条件更新直接用 `set` 指定要更新的字段即可。

### 按条件更新

按条件更新部分字段：

```java
baki.entity(Guest.class)
    .update()
    .where(w -> w.eq(Guest::getId, 10))
    .set(Guest::getAddress, "Kunming")
    .save();
```

## 删除

```java
baki.entity(Guest.class)
    .delete()
    .execute(guest);
```

按条件删除：

```java
baki.entity(Guest.class)
    .delete()
    .where(w -> w.lt(Guest::getId, 5))
    .execute();
```

## 条件构建器

默认所有条件以 `and` 连接；使用 `and(...)` / `or(...)` 可以构建嵌套逻辑。

- `and()`：内部条件以 `or` 连接。
- `or()`：内部条件以 `and` 连接。

空分组会被递归跳过，不产生多余的 `and` / `or`。如果所有条件均被跳过，按条件更新和删除仍会拒绝执行，空分组不能替代有效的 `where` 条件。
