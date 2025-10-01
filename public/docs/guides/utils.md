# 实用工具

这里总结了一些比较实用的工具类。

## SQL 字符串高亮工具

`com.github.chengyuxing.sql.utils.SqlHighlighter`

在支持 XTERM 的终端中，可输出带有语法高亮的 SQL 字符串：

```java
String highlightIfAnsiCapable(String sql);
String ansi(String sql);
```

或者通过此方法自己实现 HTML 高亮：

```java
String highlight(String sql, BiFunction<TAG, String, String> replacer);
```

`replacer` 会迭代各种类型，通过此方法包裹 HTML 标签。

## 元组

`com.github.chengyuxing.common.tuple`

框架内提供了一元组到十元组，通过静态类 `Tuples.of(...)` 来快捷使用：

## DataRow

继承自 `LinkedHashMap<String, Object>` 的一个实用数据类，提供了一些常用方法。

输入不定常的键值对数据来构建一个 Map ：

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

按顺序取直：

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

## 不可变集合

`com.github.chengyuxing.common.ImmutableList`

数据分页：

```java
ImmutableList<List<T>> grouped(int size);
```

根据条件去重：

```java
<K> ImmutableList<T> distinctBy(Function<T, K> action);
```

## 日期时间工具

`com.github.chengyuxing.common.MostDateTime`

字符串转日期时间类型：

```java
MostDateTime of(String datetime)
```

字符串日期格式支持：

- 13 位时间戳
- 10 位时间戳
- yyyyMMddHHmmss
- yyyyMMdd
- yyyy[-/年]MM[-/月]dd[日]
- yyyy[-/年]MM[-/月]dd[日] HH[:时点]mm[:分]ss[秒]
- ISO ，例如： `2019-09-26T03:45:36.656+0800`
- RFC_1123 ， 例如： `Wed, 04 Jan 2023 09:36:48 GMT`
- RFC-like ， 例如： `Wed Jan 04 2023 17:36:48 GMT+0800`
- RFC-like ， 例如： `Wed Jan 04 18:52:01 CST 2023`

时间部分的加减操作：

```java
MostDateTime minus(long amount, TemporalUnit unit);
MostDateTime plus(long amount, TemporalUnit unit);
```

格式化：

```java
String toString(String format);
```

转换为各种类型的日期时间：

```java
Instant toInstant(String datetime);
long toEpochMilli(String datetime);
...
```

## 字符串模版格式化工具

`com.github.chengyuxing.common.StringFormatter`

格式化带有模版占位参数的字符串：

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

`com.github.chengyuxing.common.utils.ObjectUtil`

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

`com.github.chengyuxing.common.utils.ReflectUtil`

根据 Getter 方法获取 Java Bean 其对应的字段：

```java
Field getGetterField(Class<?> clazz, Method method);
```

判断对象是否是基本的值类型（包括包装类）：

```java
boolean isBasicType(Object value);
```

根据构造函数参数个数和类型获取一个类的实例：

```java
<T> T getInstance(Class<T> clazz, Object... constructorParameters);
```

## 字符串工具

`com.github.chengyuxing.common.utils.StringUtil`

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

路径支持 URI 和 Classpath下的资源：

```java
FileResource(@Subst("uri or classpath") String path);
```

- ClassPath: `sql/rabbit.sql`
- URI:
  - Windows: `file:/D:/rabbit.sql`
  - Linux/Unix: `file:/root/rabbit.sql`
  - HTTP(S): `http(s)://host/rabbit.sql`
  - FTP: `ftp://username:password@ftp.example.com/path/rabbit.sql`

## 流程控制脚本引擎

```java
com.github.chengyuxing.common.script.parser.FlowControlParser
```

可在字符串模版中用来根据条件动态生成不同的内容，Rabbit SQL 框架中的[动态 SQL](documents/dynamic-sql) 就是基于此进行定制实现。

If 表达式：

```
#if expression1
     #if expression2
     ...
     #fi
     #if expression3
     ...
     #else
     ...
     #fi
#fi
```

Guard 表达式：

```
#guard expression
...
#throw 'message'
```

Choose 表达式：

```
#choose
     #when expression1
     ...
     #break
     #when expression2
     ...
     #break
     ...
     #default
     ...
     #break
#end
```

Switch 表达式：

```
#switch :key [| pipe1 | pipeN | ...]
     #case var1[, var2, varN,...]
     ...
     #break
     #case var3
     ...
     #break
     ...
     #default
     ...
     #break
#end
```

For 循环表达式：

```
  #for item[,idx] of :list [| pipe1 | pipeN | ... ] [delimiter ','] [open ''] [close '']
      ...
  #done
```

布尔条件表达式：

```javascript
!(:id >= 0 || :name | length <= 3) && :age > 21
```
