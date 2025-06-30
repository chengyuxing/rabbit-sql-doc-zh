# 使用 Rabbit SQL 插件

专为 Rabbit SQL 框架开发的 IDEA 插件，通过安装插件可以极大的简化开发流程，降低手动配置的错误率。

<iframe width="100%" height="250px" src="https://plugins.jetbrains.com/embeddable/card/21403"></iframe>

## 安装插件

- 通过IDEA插件商店进行安装：<kbd>Preferences(Settings)</kbd> > <kbd>Plugins</kbd> > <kbd>Marketplace</kbd> > <kbd>Search and find <b>"rabbit sql"</b></kbd> > <kbd>Install Plugin</kbd>；
- 通过插件[资源库](https://plugins.jetbrains.com/plugin/21403-rabbit-sql/versions)手动下载安装：<kbd>Preferences(Settings)</kbd> > <kbd>Plugins</kbd> > <kbd>⚙️</kbd> > <kbd>Install plugin from disk...</kbd> > 选择插件安装包（不需要解压）。

## XQL File Manager 工具窗口

此时 IDEA 的 Toolwindow 工具栏上就出现了图标：<img src="docs/imgs/xql-file-manager-toolwindow.svg" style="width:22px;position:relative;top:4px"></img> **XQL File Manager** ，大部分的操作都将围绕着这个工具窗口。

### 新建配置文件

工具窗口内会识别出所有标准的 maven 项目，如果是其他项目，需要手动创建目录：

```
src/main/resources
```

此时插件就能识别到项目，后续可以进行一系列操作，右键项目 <kbd>New</kbd> 弹出表单 ：

![](docs/imgs/plugin-new-xql-file-manager.png)

- 如果 `resources` 目录下没有 `xql-file-manager.yml` ，则自动创建；
- 如果有，则填入一个新的名称创建  `xql-file-manager-*.yml` ；

> [Rabbit SQL Spring Boot Starter](documents/with-spring-boot) 默认加载名为 `xql-file-manager.yml` 的配置文件，其他则通过属性：`xql-file-manager.config-location` 来指定。

### 新建 XQL 文件

xql-file-mnager.yml 右键 <kbd>New</kbd> 弹出表单新建一个 XQL 文件 ：

![](docs/imgs/plugin-new-xql.png)

文件名是文件全路径名，支持数组格式或者路径格式，并填入别名，点击 <kbd>Ok</kbd> 创建文件，并自动注册到 `xql-file-manager.yml` 中，避免手动操作导致错误。

#### 新建 SQL 片段

可以选择手动编辑 XQL 文件或者通过插件来创建，XQL 文件右键 <kbd>New</kbd> 弹出表单填入相关信息来创建一个 SQL 片段，将自动在 XQL 文件结尾插入一个 SQL 片段模版：

```sql
/*[queryUsers]*/
/*#查询所有用户#*/

;
```

XQL 文件支持 **Live Template** ，通过输入关键字 `xql` 弹出建议，快速生成模版，例如：

-  `xql:new` 自动生成一个 SQL 片段模版；
- `xql:if` 自动生成动态 SQL 脚本 IF 表达式模版；

![](docs/imgs/plugin-live-template.png)

#### 生成接口代码

右键选择菜单 <kbd>Generate Mapper...</kbd> 弹出接口配置表单填写每个 SQL 的信息：

![](docs/imgs/plugin-xql-mapping.png)

默认情况下，会根据 SQL 名前缀来自动识别出 SQL Type，如果不准确可手动选择，返回类型如果有 `PagedResource`，并且有同名 SQL 其后缀为 `_count` `Count` `-count`，则此 SQL 将自动配置为分页查询的条数查询 SQL 。

配置完成后，点击 <kbd>Generate</kbd> 将在指定包下面生成接口文件，并在 XQL 相同路径下生成对应的接口配置文件：`my.xql.rbm` ，请勿手动修改或删除。

若项目为 Spring Boot 项目，可与 [Rabbit SQL 集成](documents/with-spring-boot)，直接注入生成的 `*Mapper.java` 即可执行相应的操作。

## 测试动态 SQL

插件最主要的核心功能就是测试[动态 SQL](documents/dynamic-sql)，测试动态 SQL 的按钮 <kbd>Execute '...'</kbd> 可在这些地方找到：

- 工具窗口 SQL 片段右键；
- XQL 文件中 SQL 名 `/*[queryUsers]*/` 按下快捷键 <kbd>Alt</kbd> + <kbd>Enter</kbd> 或者点击 黄色小灯泡 💡弹出菜单；
- Java 类中所有字符串格式为 `&my.queryUsers` 按下快捷键 <kbd>Alt</kbd> + <kbd>Enter</kbd> 或者点击 黄色小灯泡 💡弹出菜单；

![](docs/imgs/execute-dynamic-sql.png)

### 参数格式

在弹出的窗口中已识别出 SQL 中所有的命名参数 `:key` 和 模版占位符 `${key}` ，参数格式将自动识别：

- 数字：`10` ， `3.14` 
- 字符串：`''` ， `""` 或者非数字 `a1`（可以不用加引号）;
- JSON 对象：标准的 JSON 数组 `{"name":"cyx", "age", 32}` ；
- JSON（对象）数组：标准的 JSON （对象）数组 `["a", "b", "c"]`；
- 常量值：`null` ，`blank` （`null` 、空白字符串、空数组、空集合）， `true` ， `false` ；

没有配置数据源则进行动态 SQL 解析查看解析效果，如果配置有数据源，可在动态 SQL 解析完成后真实的执行 SQL 访问数据库查看生成环境中的效果。

在动态 SQL 测试完成之后，尤其是 **非查询语句** （DML，DDL），请务必点击结果窗口上的回滚按钮 <kbd>回滚事务</kbd> ，毕竟这只是测试！

## 多配置文件切换激活

如果项目中存在多个不同的数据库，那么大概率相应的也会存在多个 `xql-file-manager-*.yml` 配置文件，Java 文件中若要获得自动完成建议（字符串中输入 `&` 开头会弹出候选 SQL 片段），则工具窗口 xql-file-manager-*.yml 右键：<kbd>Toggle to Active</kbd> 来激活这个配置。
