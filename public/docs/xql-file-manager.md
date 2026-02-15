# XQL 文件管理器

XQL File Manager 是 rabbit-sql 提供的 SQL 资源管理与解析组件，用于在 **保持原生 SQL 语义不变** 的前提下，为 SQL 文件提供可编程能力。

XQL 文件管理器是在 **标准 SQL 文件之上进行无侵入扩展** 的解析组件。

它通过约定格式的注释语法，为普通 SQL 增强以下能力：

- [动态 SQL](documents/dynamic-sql) 脚本
- SQL 片段复用（模板）
- SQL 元数据定义
- 多文件统一管理

它的目标是：

**让 SQL 文件具备结构化、可复用、可扩展的工程能力。**

所有扩展均基于注释实现，因此：

✅ 不破坏标准 SQL

✅ 主流 SQL IDE 仍可正常语法高亮、补全与校验

✅ 可作为增强型 SQL 解析器使用

## 整体架构模型

```
XQL File
   ↓
XQLFileManager（扫描阶段）
   ├── SQL Object
   ├── Templates
   ├── Metadata
   ↓
Runtime Invocation（执行阶段）
   ↓
Dynamic SQL Engine
   ↓
Final SQL
```

## 核心配置

核心配置文件支持 **YAML** 与 **properties** 两种格式，推荐使用：`xql-file-manager.yml` 

配置文件支持以下增强能力：

- `!path` ：使用 `/` 拼接数组为路径字符串
- `!join` ：直接拼接数组为字符串
- `${env.xxx}` ：读取系统环境变量

```yaml
constants:
  base: &basePath pgsql

files:
   foo: !path [ *basePath, foo.xql ]
   bar: bar.xql
   remote: http://127.0.0.1:8080/share/cyx.xql?token=${env.TOKEN}

pipes:
#  upper: org.example.Upper

charset: UTF-8
named-param-prefix: ':'
```

### **常量（constants）**

特性：

- 支持 YAML Anchor 引用
- 可在 SQL 中通过 `${}` 模板占位符使用

### **文件（files）**

注册需要解析的 SQL 文件。

支持文件类型：

- `.sql`
- `.xql`（推荐，IDE [插件](guides/plugin)可提供增强支持）

支持协议：

- classpath（默认）
- file://
- ftp://
- http(s)://

### **管道（pipes）**

注册[动态 SQL](documents/dynamic-sql) 中使用的自定义管道操作符。

值必须为实现类的 **完整限定类名**。

### **编码（charset）**

指定 XQL 文件解析编码，默认：`UTF-8` 。

### 命名参数前缀

```yaml
named-param-prefix: ':'
```

用于定义全局预编译命名参数前缀。

## XQL 文件规范

### 文件描述

文件顶部可定义说明注释块。

当注释中包含 `@@@` 区域时，其内容将作为文件描述信息：

```sql
/*
* Created by IntelliJ IDEA.
* User: 
* Date: 
* Time: 
@@@
一些描述写在这里。
@@@
* Typing "xql" keyword to get suggestions,
* e.g: "xql:new" will be create a sql fragment.
*/
```

### 文件主体

一个 XQL 文件由 **多个 SQL 对象** 组成。

SQL 对象之间通过 `;` 分隔，这是解析阶段的核心边界。

#### **SQL 对象生命周期**

每个 SQL 对象存在两个完全独立的阶段：

从生命周期的角度解释，每个 SQL 对象存在 2 个完全独立的生命周期：

1. 文件扫描阶段：
   - 解析元数据
   - 提取模板
   - 合并内联模板
   - 构建 SQL 结构模型
2. SQL 调用阶段：
   - 执行[动态 SQL](documents/dynamic-sql) 脚本
   - 生成最终可执行 SQL

#### **SQL 对象结构**

```sql
/*[queryGuests]*/
/*#查询访客#*/
-- @cache 30m
-- @rules admin,guest
-- #check :age > 30 throw '年龄不能大于30岁'
-- #var id = 14
-- #var users = 'a,xxx,c' | split(',')
select * from test.guest where
-- //TEMPLATE-BEGIN:myCnd
id = :id 
and name in (
    -- #for item of :users; last as isLast
        -- #if !:isLast  
        :item,
        -- #else
        :item
        -- #fi
    -- #done
    )
-- //TEMPLATE-END
;
```

一个 SQL 对象由以下部分组成：

| **部分** | **说明**              |
| -------- | --------------------- |
| 名称     | `/*[name]*/`          |
| 描述     | `/*#desc#*/`（可选）  |
| 元数据   | `-- @key value`       |
| 函数体   | SQL + 动态脚本 + 模板 |

#### 模版片段

模板用于 SQL 复用，通过 `${}` 引用。

模板分为：

- 独立模板
- 内联模板

##### 独立模版

定义方式：

```sql
/*{where}*/
where id = :id ${order};
```

使用：

```sql
select * from users ${where};
```

> 模板可递归引用其他模板。

##### 内联模版

用于在 **单个 SQL 对象内部** 定义复用片段。

特点：

- 不参与[动态 SQL](documents/dynamic-sql) 解析
- 避免 IDE SQL 校验误报
- 不污染全局模板空间

定义：

```sql
-- //TEMPLATE-BEGIN:myCnd
...
-- //TEMPLATE-END
```

示例：

```sql
/*[queryList]*/
select * from guest where
-- //TEMPLATE-BEGIN:myInLineCnd
-- #if :id != blank
id = :id
-- #fi
-- //TEMPLATE-END
;
```

引用：

```sql
/*[queryCount]*/
select count(*) from guest where ${myInLineCnd};
```

#### 元数据

元数据用于为 SQL 提供附加描述信息。

定义格式：

```sql
-- @name value
```

示例：

```sql
/*[queryUsers]*/
-- @cache 30m
-- @rules admin,guest
select * from users;
```

特点：

- 不参与[动态 SQL](documents/dynamic-sql)
- 不影响执行结果
- 可被拦截器、缓存组件等读取

例如：

> QueryCacheManager 可根据 metadata 决定缓存策略。

#### 多语句块

当 SQL 包含 PLSQL / DDL 时可能出现多个 `;` 。

可通过追加行注释避免解析歧义：

```sql
/*[myPlsql]*/
begin; --
  select 1; -- 一些描述
  select 2; --
end;
```

#### 动态 SQL

动态 SQL 通过行注释 `--` 中嵌入脚本实现。

解析过程与 SQL 本身完全解耦。

详细说明请参考：

👉 [动态 SQL](documents/dynamic-sql) 文档

## 设计理念

XQL 的目标不是替代 SQL，而是增强 SQL。

- SQL 仍然是第一公民
- 扩展全部基于注释实现
- 文件始终保持数据库工具可读
- 动态能力与执行阶段解耦

XQL 更接近“可编程 SQL 文件”，而不是 ORM。
