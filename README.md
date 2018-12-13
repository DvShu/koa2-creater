# fs-spread
对于 `nodejs` 的 `fs` 模块进行了扩展。
## 使用
### 1. 安装
```nodejs
npm i koa2-creater -g
```
### 2. 使用
```nodejs
koa2 init test
```
命令说明：
#### koa2 init [name]
初始化一个 `koa2` 工程，执行这个命令后, 会询问一些配置选项：

1. 是否需要使用session(koa-session),[y/n]?
2. 是否需要使用模板引擎(art-template),[y/n]?
3. 是否需要 mocha + supertest 进行单元测试,[y/n]?
4. 不填表示不使用mongo,[test@mongo:127.0.0.1:27017/test]
