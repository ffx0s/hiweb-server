# hiweb-server

基于 node express、graphql、mongodb、typescript 实现的后端 api 服务，使用 docker 进行开发和打包部署。

## 功能
1. 用户登录注册，含第三方登录注册（github）。
2. 文章、分类、标签、存档等模块的添加/删除/修改。
3. 留言评论功能。

## 使用

使用前先安装 docker 和 docker-compose，运行开发或构建打包任意一个命令后都会启动三个服务：

1. Node：安装依赖，编译 typescript，打包复制文件（生产环境），运行应用。
2. Mongodb：数据存储。
3. Redis：保存 session。

### 开发

首先需要添加 .env 文件到项目根目录，配置参考根目录的 .env.example 文件，然后启动开发环境：

```
cd docker-node-mongodb
docker-compose -f docker-compose.yml -f dev.yml up
```

### 构建和部署

当提交代码到 github 主分支上，github actions 就会自动执行构建打包的流程，然后把打包的内容上传到云服务器，并且执行部署命令：

```
docker-compose -f docker-compose.yml -f prod.yml up -d
```

### 测试环境

执行命令后，将会打包编译 typescript 到 dist 目录，以 dist 目录里的文件运行应用。

```
cd docker-node-mongodb
docker-compose -f docker-compose.yml -f test.yml up
```
