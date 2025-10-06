# 动态 SQL 流程控制实用小技巧

在框架中，其最核心的动态 SQL 除了和常规语言具有几乎相同的逻辑以外，可玩性不止于此，根据一些实战来获得更多的了解。

## Check 条件检查语句

在 SQL 到达数据库之前，对 SQL 的参数做一次合法性验证，并提前抛出异常，而不是等数据库来抛出异常，避免获取一次无效的 connection 对象。

特别是在无法确定这条 SQL 会在几个地方以不同的方式调用，以免程序代码中无法做到一致性的参数校验，此时 check 就发挥作用了，统一校验。

```sql
-- #check :id == null throw 'ID不能为null'
-- #check :start | type != 'Date' throw '开始时间类型必须是Date'
select * from table where ...
```

## Switch 语法讲解

在 Rabbit SQL 框架动态 SQL 中，`switch` 作用类似于 java 代码的 `switch` 语法，在 java 中，`case` 多个值的写法是这样的：

```java
switch(value){
	case "cyx":
	case "mike":
	case "bob":
	// ....
	break;
}
```

同样的 rabbit sql 也支持，只是写法略有不同，多个值写在同一个 `case` 里面，用逗号分隔：

```sql
select * from user t where t.id = :id
-- #switch :name
	-- #case cyx, mike, 'bob'
	and t.name = :name
	-- #break
-- #end
```

> 需要特别说明过一下，如果值不是纯数字和关键字（`null`, `blank`, `true`, `false`）的话，可以不需要加引号，默认为字符串, `'bob'` 的引号不是必要的。

`switch` 同样支持管道处理待比较的值：

```sql
select * from user t where t.id = :id
-- #switch :name | length
	-- #case 3
	...
	-- #break
	-- #case 4
	...
	-- #break
-- #end
```

> `length` 是内置管道，管道语法类似于 shell 中的管道功能，`| 操作符1 | 操作符2` ，可以连续写多个，可以根据需求实现更多功能的自定义管道。

## for 循环技巧

最初实现 for 循环的目的为解决 SQL `in` 语句预编译的问题，为了预编译参数尽可能覆盖到所有地方，例如有一个 `List("cyx", "mike", "bob")` ，这个参数需要用在 `in` 语句：

```sql
select * from user where id = :id
or name in 
```

这里可以利用字符串模版占位符来实现：`${!names}` ：

```sql
select * from user where id = :id
or name in (${!names})
```

> 字符串模版占位符支持集合，前面的 `!` 表明会对集合进行处理，如果不是数字，会自动加引号变为 `... name in ('cyx', 'mike', 'bob')`

但这并不够好，这是一个取巧的方式，字符串模版可能无法完全覆盖字符串的安全处理，最好的方式还是使用 `for` 循环来构建：

```sql
select * from user where id = :id
or name in (
	-- #for name of :names
		:name
	-- #done
)
```

最终执行的 SQL 的 `in` 语句部分为：`in (?, ?, ?)` 达到了预编译的效果，当然 `for` 的功能不止于此，具体可参考 [for 循环语法详解](https://rabbitsql.cn/documents/dynamic-sql)。

## 插件支持

根据流程控制语法规则，动态 SQL 可以互相嵌套，但过于复杂的动态 SQL 我们不可能等到正式环境再来测试效果，这显然是不科学的。

虽然框架本身支持动态 SQL 语法检查，但也不可能每次写完动态 SQL 重启项目，这是低效的，我们可以使用插件来测试动态 SQL，我敢说**这可能是你用过所有 SQL 框架中最好的测试工具**，无论 UI 还是效果和 IDEA 融为一体，就好像是 IDEA 内置功能：

![](docs/imgs/execute-dynamic-sql.png)

插件可自动识别 SQL 中的参数，没有数据源的情况下，可以直接测试动态 SQL 计算结果，配置数据源的情况下，甚至可以在测试库执行看到具体的查询效果，在正式上线前就可以避免很多问题！
