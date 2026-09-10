# 快速开始

如果你刚刚接触 Rabbit SQL，建议按下面顺序开始：

1. 阅读 [单独使用初始化](guides/getting-started-standalone)
2. 阅读 [与 Spring Boot 集成](guides/getting-started-spring-boot)
3. 参考 [项目初始化](documents/best-practice-project-init)
4. 通过 [核心接口 Baki](documents/core-baki) 完成第一次查询

## 一个最小示例

Spring Boot 项目中注入 `Baki`：

```java
@Autowired
Baki baki;

List<DataRow> rows = baki.query("select * from test.user where id = :id")
    .arg("id", 1)
    .rows();
```

## 推荐路径

- 普通 Java 项目：从 [单独使用初始化](guides/getting-started-standalone) 开始。
- Spring Boot 项目：从 [与 Spring Boot 集成](guides/getting-started-spring-boot) 开始。
- 已有项目迁移：查看 [升级与迁移](documents/migration)。

