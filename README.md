# SVG Editor · Lab1 Phase 1

Git 仓库：**https://github.com/lazyy11/svg-editor-phase1**

课程提交文档：[doc/README.md](doc/README.md)（架构方案、过程记录、一致性自查、质量保证）。

最终提交使用 [`final` 标签](https://github.com/lazyy11/svg-editor-phase1/tree/final)。

## 运行

需要 Node.js 20.14 或更新版本、npm。

```sh
git clone https://github.com/lazyy11/svg-editor-phase1.git
cd svg-editor-phase1
git checkout final
npm ci
npm run cli
```

```text
svg> init 800 600
svg> create g scene
svg> create rect r 10 20 100 50 #4a90d9 in scene
svg> create text t 25 50 "Hello SVG" in scene
svg> move scene 20 10
svg> undo
svg> save demo.svg
```

用浏览器打开 `demo.svg` 查看效果。输入 `help` 查看完整语法，EOF 退出。

## 验证与示例

```sh
npm run check
npm run cli -- --script examples/flowchart.commands
```

`npm run check` 执行 58 项测试及依赖方向检查。示例输出：[examples/flowchart.svg](examples/flowchart.svg)。

![两节点流程图](examples/flowchart.svg)

实现六种内置类型与全部 Phase 1 命令。外部 SVG 读写采用明确的受支持子集，边界见提交文档；`box` 与插件运行时属于后续阶段。
