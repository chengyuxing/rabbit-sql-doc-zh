# Mac升级PostgreSQL

## 升级

1. 停止PostgreSQL服务：`psqlstop`

2. 备份数据，将现有的PostgreSQL数据文件夹postgres备份为postgres.bak：

   ```bash
   $ mv /usr/local/var/postgres /usr/local/var/postgres.bak
   ```

3. 更新homebrew：`brew update`

4. 更新PostgreSQL：`brew upgrade postgresql`

5. 初始化PostgreSQL数据库：

   ```bash
   $ initdb --locale=C -E UTF-8 /usr/local/var/postgres
   ```

6. 升级PostgreSQL的bin目录和旧版数据库数据：

   ```bash
   # pg_upgrade -b oldbindir -B newbindir -d olddatadir -D newdatadir [option...]
   $ pg_upgrade -b /usr/local/Cellar/postgresql/<version>/bin -B /usr/local/Cellar/postgresql/<version>/bin -d /usr/local/var/postgres.bak -D /usr/local/var/postgres
   ```

7. 清理旧数据库文件：

   ```bash
   $ rm -rf /usr/local/var/postgres.bak
   ```

8. 启动PostgreSQL：

   ```bash
   $ pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start
   ```

## 从源码安装

### Python3环境配置

`brew install python@3.9`

创建python软连接环境：

```shell
$ ln -s /opt/homebrew/bin/python3.9 /opt/homebrew/bin/python
```

### PostgreSQL编译配置

```
brew edit postgresql
```

```ruby
......
uses_from_macos "libxml2"
uses_from_macos "libxslt"
uses_from_macos "perl"
uses_from_macos "python" #此处自定义添加python
......
args = %W[
        --disable-debug
        --prefix=#{prefix}
        --datadir=#{HOMEBREW_PREFIX}/share/postgresql
        --libdir=#{HOMEBREW_PREFIX}/lib
        --includedir=#{HOMEBREW_PREFIX}/include
        --sysconfdir=#{etc}
        --docdir=#{doc}
        --enable-thread-safety
        --with-bonjour
        --with-gssapi
        --with-icu
        --with-ldap
        --with-libxml
        --with-libxslt
        --with-openssl
        --with-pam
        --with-python  #此处增加python编译选项
        --with-perl
        --with-tcl
        --with-uuid=e2fs
      ]
......
```

安装自定义的formula（必须从源码进行编译安装）：

```shell
# intel
$ brew install --build-from-source /usr/local/Homebrew/Library/Taps/homebrew/homebrew-core/Formula/postgresql.rb

# arm
brew install --build-from-source /opt/homebrew/Library/Taps/homebrew/homebrew-core/Formula/p/postgresql@16.rb
```

创建Python3软连接：

```shell
$ ln -s /opt/homebrew/opt/python@3.9/Frameworks/Python.framework/Versions/3.9/Python /opt/homebrew/opt/python@3.9/Frameworks/Python.framework/Versions/3.9/Python3
```

创建软连接到系统库框架：

```shell
sudo ln -s /opt/homebrew/opt/python@3.9/Frameworks/Python.framework /Library/Frameworks/Python3.framework
```

### 存储过程支持Python3

```plsql
create extension "plpython3u"
```

#### postgresql@16报错处理

**Library not loaded: @rpath/Python3.framework/Versions/3.9/Python3**

**Reason: no LC_RPATH's found**

> 这个错误信息通常出现在 macOS 系统下，涉及动态库加载失败的问题，尤其是在执行应用程序时，系统无法正确找到依赖的动态库（共享库）。这里的 **LC_RPATH** 是指 Mach-O 可执行文件中的一个加载指令（load command），用于指定查找动态库的运行时路径（Runpath）。

1. **检查动态库的路径**

   使用 otool 来检查可执行文件的依赖关系和 LC_RPATH 配置。

   ```shell
   $ otool -l /opt/homebrew/opt/postgresql@16/bin/postgres | grep LC_RPATH -a
   ```

2. **使用 install_name_tool 修复 @rpath**

   需要永久解决这个问题，通过 install_name_tool 工具来修改可执行文件的 rpath，将缺失的动态库路径添加到可执行文件的查找路径中。

   - **添加** rpath：

     ```shell
     $ install_name_tool -add_rpath /Library/Frameworks /opt/homebrew/opt/postgresql@16/bin/postgres
     ```

   - **删除不需要的** rpath（如果路径错误）：

     ```shell
     $ install_name_tool -delete_rpath /opt/homebrew/opt/python@3.9/Frameworks /opt/homebrew/opt/postgresql@16/bin/postgres
     ```

   - **修改动态库的安装路径**：

     ```shell
     $ install_name_tool -change <old_path> <new_path> <executable>
     ```

3. 或者检查 **DYLD_LIBRARY_PATH** 环境变量（可选）

   ```shell
   export DYLD_LIBRARY_PATH=/Library/Frameworks:$DYLD_LIBRARY_PATH
   ```

#### 关于install_name_tool

- `install_name_tool`: 这是 macOS 的一个工具，用于修改 Mach-O 格式的可执行文件或动态库的加载路径。

- `-add_rpath`: 这是一个参数，用于为可执行文件或动态库添加一个新的运行时库路径（rpath）。rpath 是在程序运行时用于查找依赖库的路径。

- `/usr/local/opt/python@3.9/Frameworks`: 这是你想添加的 rpath 路径。在这个例子中，它指向的是 Homebrew 安装的 Python 3.9 动态库路径。这样做的目的是确保在运行时能够从这个路径加载 Python3.framework。

- `/path/to/your/executable`: 这是你要修改的可执行文件的路径。你需要把这个路径替换为 PostgreSQL 或其他相关可执行文件的实际路径。

在 macOS 系统上，当你编译了一个依赖外部动态库（如 libpython3.dylib）的应用程序时，如果在运行时系统找不到该动态库，会报出类似于 Library not loaded: @rpath/... 的错误。通过使用 install_name_tool 来添加 rpath，你可以显式告诉操作系统在运行该可执行文件时去哪些路径查找依赖库。

这个命令用于解决动态库加载路径的问题，特别是在 macOS 下，当你的程序需要依赖非标准路径的动态库时（如 Homebrew 安装的 Python）。通过 install_name_tool，你可以添加一个运行时路径，让系统能够正确找到并加载这些库。

## 备注

创建PostgreSQL数据库启动脚本别名：

`vi ~/.zprofile`

```shell
# intel
alias psqlstart='pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start'
alias psqlstop='pg_ctl -D /usr/local/var/postgres stop'

# arm
alias psqlstart='pg_ctl -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/server.log start'
alias psqlstop='pg_ctl -D /opt/homebrew/var/postgresql@16 stop'
```

