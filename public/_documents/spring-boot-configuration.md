# Spring Boot 配置项

Spring Boot Starter 支持通过 `application.yml` 配置 Rabbit SQL。

## Baki 配置

```yaml
baki:
  batch-size: 1000
  page-key: page
  size-key: size
  xql-file-manager:
    config-location: xql-file-manager.yml
    charset: UTF-8
    named-param-prefix: ':'
    constants:
      db: dev
    files:
      user: sql/user.xql
      order: sql/order.xql
    pipes:
      upper: com.example.sql.pipe.UpperPipe
```

对应属性：

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `baki.batch-size` | `1000` | 批量执行大小 |
| `baki.page-key` | `page` | 分页页码参数名 |
| `baki.size-key` | `size` | 每页条数参数名 |
| `baki.xql-file-manager.config-location` |  | XQL 配置文件位置 |
| `baki.xql-file-manager.charset` | `UTF-8` | XQL 文件编码 |
| `baki.xql-file-manager.named-param-prefix` | `:` | 命名参数前缀 |
| `baki.xql-file-manager.constants` |  | 常量池 |
| `baki.xql-file-manager.files` |  | XQL 文件别名映射 |
| `baki.xql-file-manager.pipes` |  | 自定义管道映射 |

## 入口参数

也可以通过启动参数覆盖配置：

```bash
--xql.config.constants.db=prod
```

更多 Spring Boot 集成内容见 [集成 Spring Boot](documents/spring-boot)。

