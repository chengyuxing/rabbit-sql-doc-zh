# 动态 SQL

作为整个框架的核心，动态 SQL 的管理和解析依赖于 [XQLFileManager](documents/xql-file-manager) ，基于标准 SQL 注释进行功能扩展，通过解析特殊的注释标记，在不破坏 SQL 文件标准的前提下进行动态解析。

> **条件脚本与 SQL 正文的语法不同：** `-- #if :a && :b` 使用 `&&`，其下方的 SQL 使用 `and`；逻辑或分别使用 `||` 和 `or`。脚本不支持用 `and`、`or`、`not` 代替逻辑符号，详见[逻辑运算符](documents/xql-dynamic-sql#md-head-10)。

动态 SQL 的内置控制指令包括：

- [变量定义](documents/xql-dynamic-sql#md-head-3)：`#var`
- [前置检查](documents/xql-dynamic-sql#md-head-2)：`#check`

- [If 逻辑判断](documents/xql-dynamic-sql#md-head-4)：`#if` , `#else` , `#fi`
- [守卫语句](documents/xql-dynamic-sql#md-head-5)：`#guard` , `#throw`
- [Switch 分支判断](documents/xql-dynamic-sql#md-head-6)：`#switch` , `#case` , `#default` , `#break` , `#end`
- [Choose 分支判断](documents/xql-dynamic-sql#md-head-7)：`#choose` , `#when` , `#default` , `#break` , `#end`
- [For 循环](documents/xql-dynamic-sql#md-head-8)：`#for` , `#done`

每个指令关键字以 `#` 号开头， 都必须单独成为一行，指令的组合有严格的规则，和程序语言中的几乎一致。

在动态 SQL 解析中，为了保证编辑器不影响 SQL 的格式化和避免语法检查误判，默认是加上行注释前缀 `--` ，但如果是 MySQL 的话，`#` 号就是标准注释，所以可以不用加 `--` 。

每个指令所在的表达式也有其特有的结构关键字，例如 For 循环中 `of` 就是专属的关键字：

```sql
#for item of :list

#done
```

控制指令中的变量以 `:` 号开头，和 SQL 的命名参数看上去都一样，但其含义并不同：

- SQL 语句：作为命名参数，会被动态编译为 `?` 号，作为 SQL 参数参与执行；
- 控制指令：值传递，为解析指令提供变量。

## 控制指令

每个控制指令都有其特定的语法结构，为了能更方便的理解，以下进行详细的介绍，包括其细节和一些使用技巧。

### 前置检查

`#check` 的表达式描述需要拒绝的情况：结果为 **`true`** 时抛出 `CheckViolationException`，异常信息为 `throw` 后的字符串，并终止后续解析；结果为 **`false`** 时继续解析 SQL。

下面的例子中，`id = 11` 会抛出“ID 不能大于 10”，`id = 10` 会继续解析。这里写的是触发异常的条件，不是参数合法的条件。检查在动态 SQL 解析阶段完成，失败时不执行后续 SQL。

```sql
-- #check :id > 10 throw 'ID 不能大于 10'
...
```

> 相比于在代码层面去验证参数合法性更加底层，特别是同一条 SQL 会被多个地方调用时，更加不容易遗漏参数校验。
>
> 代码层面则可以更专注于业务，做到职责分离。

### 变量定义

变量定义语句，变量值可以是[常量](documents/xql-dynamic-sql#md-head-13)，也可以是传入的参数经过[管道](documents/xql-dynamic-sql#md-head-18)处理，通过扩展管道，实现各种复杂的变量定义。

定义的变量可以通过 SQL 的命名参数形式传递给 SQL，同样也为其他指令提供变量。

```sql
-- #var list = 'cyx,jack,mike' | split(',')
-- #var newId = :id
select * from table where id = :newId and name in (
-- #for item of :list; last as isLast
  -- #if :isLast
  :item
  -- #else
  :item,
  -- #fi
-- #done
)
```

### IF 逻辑判断

IF 条件判断语句，逻辑和编程语言中的 if 一样，是使用频率最高、也最简单的指令。完整语法如下，`#else` 可选。它没有 `else if`，如果需要多分支，使用 `#choose` 会更合适。

```sql
-- #if :user <> null
    ...
-- #else
    ...
-- #fi
```

### 守卫语句

`#guard` 的条件为 `true` 时解析其 SQL 分支，为 `false` 时通过 `#throw` 抛出异常。这里的条件描述允许继续执行的情况；`#check` 的条件则描述需要拒绝的情况。需要同时完成以下两项工作时，可使用守卫语句：

1. 需要拼接动态 SQL；
2. 需要校验参数合法性；

```sql
-- #guard :user <> blank
    ...
-- #throw 'message'
```

> 要用 `#check` 表达相同校验，需要将守卫条件取反。例如 `#guard :user <> blank` 对应的检查是 `#check :user == blank throw 'message'`，然后再编写 SQL 分支。

### SWITCH 分支判断

效果和编程语言中的 switch 一样，按顺序匹配每个 case 分支并执行**等于**判断，第一个条件满足后直接跳出整个 switch。

`#case` 指令支持多组值：当多个值满足相同分支时，可以用逗号分隔来简化写法。`#default` 分支同样是可选的。

```sql
-- #switch :name
       -- #case 'a', 'b', c
       ...
       -- #break	
       -- #case 'd'
       ...
       -- #break
       ...
       -- #default
       ...
       -- #break
-- #end
```

> 在上面例子中，值 `c` 没有加引号，这不是错误，是动态 SQL 脚本中所支持的隐式转换，详细说明参考[字符串常量值](documents/xql-dynamic-sql#md-head-15)语法规则。

### CHOOSE 分支判断

结构和 `#switch` 相同，但每个 `#when` 分支接受一个比较表达式，按顺序匹配，第一个条件满足后直接跳出整个 choose。

choose 可以模拟 **如果-否则如果1-...-否则如果N-否则** 这样的结构。`#default` 分支同样是可选的。

```sql
-- #choose
       -- #when :id >= 0
       	...
       -- #break
       ...
       -- #default
       	...
       -- #break
-- #end
```

### FOR 循环

集合遍历语句，效果和编程语言一样，遍历一个集合并将循环体内容进行累加。

```sql
-- #for item of :list; index as i; last as isLast
	...
-- #done
```

**for表达式**语法说明：

关键字：`of` `as`

```
item of :list [| pipe1 | pipeN | ... ] [;index as i] [;last as isLast] ...
```

- `[...]` 表示可选配置项；
- `item` 表示当前值；
- `:list` 表示当前迭代的对象，后面可以追加[管道](documents/xql-dynamic-sql#md-head-18)进行一些特殊处理；
- 上下文属性：
  - `index` 当前项目的索引；
  - `first` 当前项目是否为第一个；
  - `last` 当前项目是否为最后一个；
  - `odd` 当前项目的索引是否为奇数；
  - `even` 当前项目的索引是否为偶数；

## 表达式脚本

`#if`、`#when`、`#guard`、`#check` 的条件使用同一套脚本表达式规则。表达式由 RabbitSQL 在生成 SQL 时求值，数据库不会执行这些条件。

变量以 `:` 开头，例如 `:age`、`:user.name`、`:books[0].price`；没有 `:` 的值是常量。比较表达式的基本形式为 `值A 运算符 值B`，值可以先经过管道转换，再参与比较。

### 逻辑运算符

**脚本条件使用 `&&`、`||`、`!`，不支持用 `and`、`or`、`not` 代替。SQL 正文仍使用数据库的 `and`、`or`、`not`。**

| 运算符 | 含义 | 示例 |
| --- | --- | --- |
| `&&` | 逻辑与，两边都为真才为真 | `:age >= 18 && :enabled == true` |
| `\|\|` | 逻辑或，任一边为真即为真 | `:role == admin \|\| :role == manager` |
| `!` | 逻辑非，对条件结果取反 | `!(:age >= 18)` |
| `()` | 将条件分组 | `(:role == admin \|\| :role == manager) && :enabled` |

下面的脚本条件和 SQL 条件使用不同的运算符：

```sql
select * from users
where 1 = 1
-- #if :name <> blank && :enabled == true
  and name = :name
  and enabled = :enabled
-- #fi
```

`#if` 的条件为真时，SQL 分支才会保留；分支中的 `:name`、`:enabled` 是预编译参数。下面这种写法是脚本语法错误：

```sql
-- #if :name <> blank and :enabled == true
```

同样，单个 `&` 不是逻辑与；单个 `|` 是管道，两个 `||` 才是逻辑或。

各指令对条件结果的处理如下，尤其注意 `#check` 的方向：

| 指令 | 条件为 `true` | 条件为 `false` |
| --- | --- | --- |
| `#if` | 保留当前分支 | 执行 `#else` 分支；没有 `#else` 则跳过 |
| `#when` | 执行此分支，结束当前 `#choose` | 继续尝试后续分支，均不满足时执行 `#default` |
| `#guard` | 保留当前分支 | 抛出 `#throw` 指定的异常信息 |
| `#check` | 抛出 `throw` 指定的异常信息，终止解析 | 继续解析 |

`#switch` / `#case` 比较的是值，不是布尔条件；需要组合多个条件时使用 `#choose` / `#when`。

### 优先级与短路求值

从高到低，可以按以下顺序理解表达式：

1. 用 `()` 分组的条件；
2. 值的管道转换，例如 `:name | length`；
3. 比较或单值条件，例如 `:age >= 18`、`:enabled`；
4. `!` 对紧随其后的条件取反，建议用 `!(条件)` 明确范围；
5. `&&`；
6. `||`。

例如 `:a || :b && :c` 等效于 `:a || (:b && :c)`，如果希望先判断逻辑或，应写成 `(:a || :b) && :c`。同级的 `&&` 或 `||` 从左到右求值。

`&&` 和 `||` 支持短路：左侧为假时，`&&` 不再求值右侧；左侧为真时，`||` 不再求值右侧，包括右侧的管道。可以用前置条件保护后续比较：

```sql
-- #if :age <> blank && :age >= 18
  and age >= :age
-- #fi
```

上例中，`age` 为空时不会执行数值比较。但非空值仍须是数字或合法的数字字符串；短路也不会绕过脚本语法检查，未被执行的分支仍必须符合语法。

### 单值条件与空值

条件可以只写一个值，例如 `#if :enabled`，其判断规则为：

- **Boolean**：直接使用布尔值，`true` 为真，`false` 为假。
- **其他类型**：非空为真，空值为假；`null`、空字符串、只含空白字符的字符串、空数组、空集合、空 Map、无元素的 Iterable 都属于空值。

当 `enabled` 为 Boolean 时，`:enabled` 等效于 `:enabled == true`；其他类型遵循上述非空规则。`!:enabled` 对单值条件取反。数字 `0`、字符串 `'false'`、字符串 `'0'` 都是非空值，单独作为条件时为真。判断数字应显式比较，例如 `:count > 0`。

```sql
-- #if :enabled
  and enabled = true
-- #fi
-- #if :ids <> blank
  -- 此处按需生成 in 条件
-- #fi
-- #check :name == blank throw 'name 不能为空'
```

**空值比较不是 Java 的严格类型比较。** 比较器会将各种空值视为相等，因此 `:value == null` 也会匹配空字符串、空集合等。检查是否为空建议写 `:value == blank`，检查是否非空写 `:value <> blank`；如需严格区分 null 与其他空值，可使用自定义管道。

### 常量值

常量可以加引号，也可以不加引号。不加引号时，数字与内置关键字会转换为相应类型，普通标识符作为字符串。

#### 内置关键字

内置关键字为 `blank`、`null`、`true`、`false`，不区分大小写。`true`、`false` 为 Boolean，`null` 为 null，`blank` 用于表达空值比较。

#### 字符串

单引号或双引号包裹的内容作为字符串；普通标识符也可以省略引号，例如 `admin`、`'admin'`、`"admin"` 都表示字符串。包含空格、标点或脚本符号时应加引号，避免被拆成多个 token。

```sql
-- #if :role == admin
  and role = :role
-- #fi
-- #if :label == 'sales and support'
  and label = :label
-- #fi
```

数字和关键字加上引号后也是字符串，例如 `'false'` 与 `false` 的类型不同，作为单值条件时前者为真、后者为假。`'blank'` 是普通字符串，不表示空值。

#### 数字

支持整数、小数及正负号，例如 `12`、`3.14`、`-1`、`+2`。表达式不提供 `+`、`-`、`*`、`/` 算术运算；需要计算时先在 Java 中处理，或使用自定义管道。

### 比较运算符

| 运算符 | 说明 |
| --- | --- |
| `<`、`>`、`>=`、`<=` | 数值大小比较 |
| `==`、`=` | 等于；条件中的 `=` 也是比较，不是赋值 |
| `!=`、`<>` | 不等于 |
| `~` | 正则包含，使用 `Matcher.find()` |
| `!~` | 正则不包含 |
| `@` | 正则完整匹配，使用 `Matcher.matches()` |
| `!@` | 正则不完整匹配 |

大小比较支持数字和合法的数字字符串，例如 `'18' >= 18` 为真；不支持字符串字典序或日期大小比较，非数字值会报错。

相等比较先处理空值，再比较值的字符串表示，不要求 Java 类型相同。例如 `18 == '18'` 为真，但 `1 == '01'` 为假。不要将相等比较与数值大小比较的转换规则混为一谈。

正则操作的两边应为字符串。`~` 可以匹配字符串中的一部分，`@` 要求整个字符串匹配，例如：

```sql
-- #if :name ~ 'admin'
  -- name 为 'super-admin' 时条件为真
-- #fi
-- #if :name @ 'admin'
  -- name 必须完整匹配 'admin'
-- #fi
```

不要照搬 SQL 的 `is null`、`like`、`in (...)`、`between ... and ...` 作为脚本条件；空值使用 `blank` 比较，字符串匹配使用正则，成员判断可以使用 `in` 管道。

### 管道

管道使用单个 `|`，把左侧的值作为输入，可链式调用，也可以带参数：

```sql
-- #if :name | length <= 3
  and name = :name
-- #fi
-- #if :role | in('admin', 'manager')
  and role = :role
-- #fi
-- #if (:role | in('admin', 'manager')) && :enabled
  and enabled = :enabled
-- #fi
```

`in` 是管道名称，上例表示判断 `role` 是否在参数列表中，不是 SQL 的 `in (...)` 语法。管道的结果可以继续经过下一个管道、参与比较，或直接作为单值条件。

| 内置管道 | 用途 | 示例 |
| --- | --- | --- |
| `length` | 字符串长度、数组或集合大小；null 返回 0 | `:name \| length` |
| `upper` | 字符串转大写 | `:name \| upper` |
| `lower` | 字符串转小写 | `:name \| lower` |
| `kv` | 对象或 Map 转为键值对集合，便于循环 | `:sets \| kv` |
| `nvl` | 值为 null 时返回默认值 | `:name \| nvl('default')` |
| `split` | 按正则表达式分隔符拆分字符串 | `:roles \| split(',')` |
| `in` | 判断输入值是否在参数列表中 | `:role \| in('admin', 'manager')` |

通过实现 `com.github.chengyuxing.common.script.pipe.IPipe` 并注册到 [XQLFileManager](documents/xql-file-manager)，可以扩展管道。`nvl` 只替换 null，不会替换非 null 的空字符串；`in` 按值本身判断成员关系，不使用上面的字符串相等转换规则。

### 常见误写

| 误写或误解 | 正确写法或规则 |
| --- | --- |
| `:a and :b` / `:a or :b` / `not :a` | `:a && :b` / `:a \|\| :b` / `!:a` |
| 用 `:a \| :b` 表达逻辑或 | 使用 `:a \|\| :b`；单个 `\|` 后面是管道名称 |
| `:name is not null` | 使用 `:name <> blank` 检查非空 |
| `:role in ('admin', 'manager')` | 使用 `:role \| in('admin', 'manager')` |
| 用 `#if :count` 判断 count 大于 0 | 写 `#if :count > 0`，数字 0 本身也是非空值 |
| 把 `#check` 当作通过条件 | `#check` 为真表示有问题，应抛出异常 |
| 用 `:a < :b < :c` 连续比较 | 写 `:a < :b && :b < :c` |

## 示例

以下的例子主要以动态生成**命名参数sql**来展开进行讲解，**命名参数**最终都会被进行预编译为 `?` ，避免 SQL 注入的风险。

**for** 标签特别是在构建 SQL 的 `in` 语句时且需要达到预编译 SQL 的效果时特别有用：

```sql
/*[query]*/
select * from test.user where id = 1
-- #if :ids
or id in (
    -- #for id of :ids; last as isLast
        -- #if :id >= 8
            -- #if !:isLast
                :id,
            -- #else
                :id
            -- #fi
        -- #fi
    -- #done
    )
-- #fi
;
```

```javascript
{"ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
```

在 SQL 中以 `:` 开头的变量名，表示这是一个会被预编译的命名参数；

> 如果 `in` 部分的数据来源可靠并且不强求预编译，也可以使用字符串模板实现，例如改成 `... or id in (${!ids})`。具体含义可参考[字符串模板](documents/core-sql-params#md-head-2)。

**for** 也可以用来构建 `update` 语句：

```sql
/*[update]*/
update test.user
set
-- #for set of :sets | kv; last as isLast
    -- #if !:isLast
    ${set.key} = :set.value,
    -- #else
    ${set.key} = :set.value
    -- #fi
-- #done
where id = :id;
```

```javascript
{
  "id": 10,
  "sets": {
    "name": "abc",
    "age": 30,
    "address": "kunming"
  }
}
```

说明：

- `:sets` 对应的值是一个 Map 对象，经过 `kv` **管道**后变成**键值对集合**，因此可以用于 **for** 表达式；

根据不同数据库进行判断来拼接适合的 SQL：

```sql
/*[query]*/
select * from test.user
where id = 3
-- #if :_databaseId.name == 'postgresql'
    ...
-- #fi
-- #if :_databaseId.name == 'oracle'
    ...
-- #fi
;
```

> 内置变量 `_databaseId` 的值是当前数据库信息对象 `com.github.chengyuxing.sql.types.DatabaseInfo`，由 BakiDao 在运行时提供。
