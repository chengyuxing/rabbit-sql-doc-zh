# 实用工具

这里总结了一些比较实用的工具类。

## SQL 字符串高亮工具

`com.github.chengyuxing.sql.util.SqlHighlighter`

直接生成 ANSI 高亮，或根据 `System.console()` 和 `TERM` 判断是否启用终端配色：

```java
String sql = "select :id, '/* 普通内容 */';\n";
String colored = SqlHighlighter.ansi(sql);
String consoleText = SqlHighlighter.highlightIfAnsiCapable(sql);
```

高亮按原始 SQL 片段拼接，保留分号、空白、换行和字符串内容。字符串、双引号或反引号标识符、普通注释中的 `:name` 不会被标记为 SQL 参数；支持重复引号转义、跨行字符串、PostgreSQL `E'...'` 转义字符串和嵌套块注释。

PostgreSQL `$$...$$`、`$tag$...$tag$` 作为完整字符串着色，分隔符紧贴正文也能识别。它们内部的 SQL、注释和参数文本不会再次进行 SQL 高亮。RabbitScript 指令、元数据和内联模版注释仍保留内部表达式配色。

高亮只处理显示，不校验 SQL 合法性。未闭合的引号、注释和 dollar quoted 片段会保留原文；自定义回调抛出异常时，方法返回完整原 SQL。

### 自定义输出

使用三参数方法定制识别到的片段：

```java
String highlight(String sql,
                 Function<String, String> commentStyleCleaner,
                 BiFunction<SqlHighlighter.TAG, String, String> replacer);
```

`commentStyleCleaner` 在分类注释前移除已有样式，例如使用 `Printer::removeStyle`；原始纯文本也可使用 `Function.identity()`。`replacer` 接收词法标签和原文片段，未识别为词法片段的空白及符号原样保留。

```java
String original = SqlHighlighter.highlight(sql, Function.identity(),
        (tag, content) -> content);
// original 与 sql 完全一致
```

主要标签包括 `KEYWORD`、`FUNCTION`、`NUMBER`、`QUOTE_STRING`、`NAMED_PARAMETER`、`ASTERISK`、`LINE_COMMENT`、`BLOCK_COMMENT`，以及三种特殊注释标签 `RABBIT_SCRIPT_COMMENT`、`METADATA_DEFINE_COMMENT`、`INLINE_TEMPLATE_COMMENT`。

`NAMED_PARAMETER` 的回调内容不包含前导冒号，例如 `:user.id` 对应 `user.id`；冒号由高亮器原样保留。dollar quoted 片段整体使用 `QUOTE_STRING`，不再按 `POSTGRESQL_FUNCTION_BODY_SYMBOL` 分别处理其分隔符。

## 元组

`com.github.chengyuxing.common.tuple`

框架内提供了一元组到十元组，通过静态类 `Tuples.of(...)` 来快捷使用：

## DataRow

继承自 `LinkedHashMap<String, Object>` 的一个实用数据类，提供了一些常用方法。

传入不定长的键值对数据来构建一个 Map：

```java
DataRow of(Object... input);
```

将实体转为 Map ：

```java
DataRow ofEntity(Object entity);
```

获取一个值并进行转换，如果值为 `null` ，则依次选择候选者直到不为 `null`。

根据键名：

```java
<T> T getAs(String name, T... defaults);
```

按顺序取值：

```java
<T> T getAs(int index, T... defaults);
```

强制转换类型：

```java
String getString(String name, String... defaults);
```

挑出一些 key 来生成一新的 DataRow：

```java
DataRow pick(String name, String... more);
```

转为实体：

```java
<T> T toEntity(@NotNull Class<T> clazz, Object... constructorParameters)
```

## 日期时间工具

`com.github.chengyuxing.common.MostDateTime`

### 完整解析与文本提取

`parse(String)` 校验完整输入，适合数据库值和业务参数；非法日期、未识别的前后缀及多余的小数秒位数会报错。`of(String)` 保留从文本中提取日期的能力：

```java
MostDateTime value = MostDateTime.parse("2026-10-09T12:34:56.123456789Z");
MostDateTime extracted = MostDateTime.of("决定书二〇〇一年十二月二十一日的");
```

支持的输入包括：

- 13 位毫秒时间戳、10 位秒时间戳。
- 紧凑格式 `yyyyMMddHHmmssSSS`、`yyyyMMddHHmmss`、`yyyyMMdd`。
- 普通日期，例如 `2026-10-09`、`2026/10/09`、`2026.10.09`、`2026年10月9日`。
- 普通日期时间，例如 `2026-10-09 12:34:56.1234`、`2026年10月9日 12时34分56秒`。
- 中文日期，例如 `二〇二六年六月二十六日`。
- ISO，例如 `2026-10-09T12:34:56.1Z`、`2019-09-26T03:45:36.656+0800`，标准格式也支持区域时区。
- SQL 风格的带偏移时间，例如 `2026-10-10 10:35:57.672+08`、`2026-10-10 10:35:57.672+0800`、`2026-10-10 10:35:57.672+08:30`；秒数可省略，偏移量前可有一个空格，例如 `2026-10-10 10:35 +08`。
- RFC_1123，例如 `Wed, 04 Jan 2023 09:36:48 GMT`。
- RFC-like，例如 `Wed Jan 04 2023 17:36:48 GMT+0800`、`Wed Jan 04 18:52:01 CST 2023`。

从 rabbit-common `3.2.14` 起，上述 SQL 风格的偏移时间在完整解析和文本提取中都保留显式偏移量。`+08:30` 不会被截成 `+08`，RFC-like GMT 文本中的偏移也使用相同修复。以 `Instant`、`Date` 或 `Timestamp` 表示时刻时，显式偏移不受服务器默认时区影响：

```java
String source = "2026-10-10 10:35:57.672+08";
MostDateTime.parse(source).toInstant(); // 2026-10-10T02:35:57.672Z
ValueUtils.adaptValue(Instant.class, source); // 同一个时刻
MostDateTime.of("created at 2026-10-10 10:35:57.672+08:30 (record)")
        .toInstant(); // 2026-10-10T02:05:57.672Z
```

`parse` 已统一兼容已知格式，但仍检查完整输入；`ValueUtils.adaptValue` 不会在解析失败后退回 `of`，避免将带错误尾部的数据当作转换成功。`of` 用于显式的文本提取，适合业务自行处理描述性文本。

小数秒支持 1～9 位，按小数位数补齐纳秒，例如 `.1234` 对应 `123400000` 纳秒。紧凑日期和指定格式严格校验，不会把 `20260230` 自动修正成月底。

指定格式使用 `of(datetime, pattern)`，按完整输入解析，保留格式中的偏移或区域时区；引号中的格式字母按字面量处理：

```java
MostDateTime utc = MostDateTime.of("2026-10-09 12:34:56 +00:00",
        "yyyy-MM-dd HH:mm:ss XXX");
MostDateTime literal = MostDateTime.of("2026-10-09 H", "yyyy-MM-dd 'H'");
```

### 时区和缺省日期

`of(Temporal)` 保留输入已有的时区或偏移；无时区的本地值使用系统默认时区。`of(Temporal, ZoneId)` 将带时区的输入转换到目标时区，保留同一个时刻；本地日期和时间在目标时区解释：

```java
OffsetDateTime source = OffsetDateTime.parse("2026-10-09T12:34:56+08:00");
MostDateTime utc = MostDateTime.of(source, ZoneId.of("UTC"));
// utc.toInstant() 为 2026-10-09T04:34:56Z
```

纯时间统一以其所属时区的今天为日期，纯时间字符串使用系统默认时区；缺少年份使用当前年份。RFC-like 中的 `CST` 有歧义，为兼容原有解析规则仍按系统默认时区解释；需要确定时区时使用明确偏移或区域时区。

`of(Date, ZoneId)` 按源对象的 epoch 时间值转换，支持 JDBC 日期子类；`Timestamp` 保留纳秒。SQL 日期转 `LocalDate`、SQL 时间转 `LocalTime` 时，使用 [ValueUtils](guides/utils) 的对应类型转换以保留日历值。

### 转换、运算和格式化

转换方法均在实例上调用，不接收日期字符串：

| 方法 | 返回类型与含义 |
| --- | --- |
| `toLocalDateTime()` | `LocalDateTime`，本地日期时间，不包含时区 |
| `getZonedDateTime()` | `ZonedDateTime`，保留区域时区或偏移 |
| `toLocalDate()` | `LocalDate`，日期部分 |
| `toLocalTime()` | `LocalTime`，时间部分 |
| `toInstant()` | `Instant`，时间线上的绝对时刻 |
| `toDate()` | 普通 `java.util.Date`，毫秒精度 |
| `toEpochMilli()` | epoch 毫秒时间值 |

```java
MostDateTime next = value.plus(1, ChronoUnit.DAYS);
MostDateTime previous = value.minus(30, ChronoUnit.MINUTES);
String formatted = value.toString("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
```

旧的无参 `toZonedDateTime()` 实际返回 `LocalDateTime`，已更名为 `toLocalDateTime()`，旧调用需要修改；带时区结果使用 `getZonedDateTime()`。静态方法 `MostDateTime.toZonedDateTime(String)` 仍提供文本提取，验证完整字符串使用 `parse(String)`。

## 字符串模板格式化工具

`com.github.chengyuxing.common.StringFormatter`

格式化带有模板占位参数的字符串：

```java
String format(String template, Map<String, ?> data);
```

例如：

```sql
select ${ fields } from test.user
  where ${  cnd}
  and id in (${!idArr})
  or id = ${!idArr.1}
```

变量：

```javascript
{
  fields: "id, name",
  cnd: "name = 'cyx'",
  idArr: ["a", "b", "c"]
  }
```

结果：

```sql
select id, name from test.user
  where name = 'cyx'
  and id in ('a', 'b', 'c')
  or id = 'b'
```

## 未检查自动关闭接口

`com.github.chengyuxing.common.UncheckedCloseable`

**从里到外**依次对实现了 `Closeable` 的对象进行自动关闭。

构造一个对象：

```java
UncheckedCloseable wrap(AutoCloseable closeable);
```

继续嵌套：

```java
UncheckedCloseable nest(AutoCloseable closeable);
```

## 对象值工具

`com.github.chengyuxing.common.util.ValueUtils`

### 日期和时间类型适配

```java
Date date = ValueUtils.adaptValue(Date.class, java.sql.Date.valueOf("2026-10-09"));
Instant instant = date.toInstant();
LocalDate localDate = ValueUtils.adaptValue(LocalDate.class,
        java.sql.Date.valueOf("2026-10-09"));
```

转换规则如下：

| 目标类型或转换 | 行为 |
| --- | --- |
| SQL 日期子类 → `java.util.Date` | 复制成普通 `Date`，保留毫秒值，避免运行时仍为 SQL 日期子类 |
| 显式 SQL 日期类型 | 保留或转换到 `java.sql.Date`、`Time`、`Timestamp` 对应类型 |
| `java.sql.Date` → `LocalDate` | 保留日期日历值，不按其他时区移动日期 |
| `java.sql.Time` → `LocalTime` | 保留时间日历值 |
| 日期对象 → 其他支持的 Java 时间类型 | 按 epoch 时间值和时区转换；`Timestamp` 保留纳秒 |
| 字符串 → 日期或 Java 时间类型 | 使用 `MostDateTime.parse(String)` 校验完整输入 |

`toTemporal(targetType, date, zoneId)` 可指定转换时区；不传 `zoneId` 的重载使用系统默认时区。支持 `LocalDateTime`、`ZonedDateTime`、`OffsetDateTime`、`LocalDate`、`LocalTime`、`OffsetTime`、`Instant`。原值为 `null` 时，`adaptValue` 返回 `null`。

普通 `Date` 只能保存毫秒。字符串或 `Timestamp` 转到 `Timestamp`、`Instant`、`LocalDateTime` 等支持纳秒的类型时保留支持的精度。实体自定义值转换可直接调用 `ValueUtils.adaptValue(field.getType(), value)`，详见 [实体兼容 JPA 等其他框架](guides/advanced-jpa)。

### 其他对象值工具

平铺 IF-ELSE-ELSE-IF-ELSE 值比较返回满足的值，效果类似 Oracle 的 `decode` 函数：

```java
Object decode(Object value, Object equal, Object result, Object... more);
```

从一组候选者中获取第一个不为 `null` 的值：

```java
<T> T coalesce(T... values);
```

如果2个值相等则返回 `null` ：

```java
Object nullif(Object a, Object b);
```

使用路径表达式 `/a/b/0/name` 获取一个深度嵌套对象值：

```java
Object walkDeepValue(Object obj, @NotNull String path);
```

使用对象表达式 `user.name` 获取一个深度嵌套对象值：

```java
Object getDeepValue(Object obj, @NotNull String propertyChains);
```

## 反射工具

`com.github.chengyuxing.common.util.ReflectUtils`

判断对象是否是基本的值类型（包括包装类）：

```java
boolean isBasicType(Object value);
```

根据构造函数参数个数和类型获取一个类的实例：

```java
<T> T getInstance(Class<T> clazz, Object... constructorParameters);
```

## 字符串工具

`com.github.chengyuxing.common.util.StringUtils`

使用带有分隔符捕获组的正则表达式对字符串进行分割，返回分割后的字符串集合和分隔符集合：

```java
Pair<List<String>, List<String>> regexSplit(final String s, @Language("Regexp") final String regex, final String groupName);
```

替换所有匹配的项，并返回替换后的字符串和被替换的内容集合：

```mermaid
graph LR
A["Hello world"] --H|w--> B["#$0#"];
B --> C["#H#ello #w#orld"]
B --> D["H, w"]
```

```java
Pair<String, List<String>> replaceAll(final String s, @Language("Regexp") final String regex, final String replacement);
```

判断是否以一组关键字任意一个开头：

```java
boolean startsWiths(String str, String... keywords);
```

不区分大小写的 `indexOf` 方法：

```java
int indexOfIgnoreCase(String source, String target);
```

摘要算法：

```java
String hash(String content, String algorithm);
```

## 文件读取工具

`com.github.chengyuxing.common.io.FileResource`

路径支持 URI 和 Classpath 下的资源：

```java
FileResource(@NotNull String path);
```

- ClassPath: `sql/rabbit.sql`
- URI:
  - Windows: `file:/D:/rabbit.sql`
  - Linux/Unix: `file:/root/rabbit.sql`
  - HTTP(S): `http(s)://host/rabbit.sql`
  - FTP: `ftp://username:password@ftp.example.com/path/rabbit.sql`
