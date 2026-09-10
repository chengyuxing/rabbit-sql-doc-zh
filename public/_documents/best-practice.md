# Rabbit SQL 最佳实践

这是一套面向 Rabbit SQL 项目的工程化建议，按主题拆分为以下页面：

- [项目初始化](documents/best-practice-project-init)：环境准备、依赖引入、XQL 文件配置与目录规范。
- [XQL 编写最佳实践](documents/best-practice-xql)：SQL 命名、参数表达式、内联模板、PLSQL、动态 SQL 和 for 循环。
- [接口映射与插件](documents/best-practice-mapper)：Baki、XQL 接口映射、IDEA 插件与动态 SQL 测试。
- [性能、安全与部署](documents/best-practice-performance)：性能优化、错误处理、SQL 注入防护、连接池与部署建议。

## 核心原则

1. **SQL 是第一公民**：优先保持 SQL 原生、可读、可被 IDE 校验。
2. **参数尽量预编译**：用户输入通过 `:name` 传入，避免直接拼接。
3. **公共片段模板化**：重复条件使用 XQL 模板，降低维护成本。
4. **复杂动态 SQL 提前测试**：通过 IDEA 插件在开发阶段验证，避免上线后再排查。
5. **资源及时释放**：惰性查询返回 `Stream` 时，使用 `try-with-resource` 包裹。

## 快速开始

如果还没有完整接入项目，可以直接阅读：

- [单独使用初始化](guides/getting-started-standalone)
- [与 Spring Boot 集成](guides/getting-started-spring-boot)
