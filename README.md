# DJI智图 API SDK for Node.js

## 介绍

**DJI智图 API SDK** 是一个用于封装 **大疆智图 API** 的 Node.js SDK，提供了简单易用的接口，帮助开发者免去繁琐的 API 调用签名过程，直接通过 SDK 发送请求。

此外，该 SDK 还提供了 **TypeScript 类型声明文件**，使 TypeScript 开发者可以通过类型检查确保请求参数和返回值的正确性，从而提高开发效率并减少错误。

## 特性

- **简化 API 调用**：封装复杂的签名计算，开发者无需手动计算 API 请求签名。
- **TypeScript 支持**：提供完整的 TypeScript 类型声明，增强代码可靠性和可维护性。
- **完整测试流程脚本**：提供示例脚本，可用于快速学习和实际使用 SDK 进行 3D 重建。

## 安装

使用 npm 或 yarn 进行安装：

```sh
npm install dji-terra-api-sdk
```

或

```sh
yarn add dji-terra-api-sdk
```

## 快速开始

参考：test/full-step.ts

## 测试脚本

由于该 SDK 仅对 **大疆智图 API** 进行封装，不包含额外的自定义逻辑，因此没有采用代码测试框架或覆盖率工具。

在 `test` 目录下，提供了一个完整的 **测试脚本**，它不仅可以用于验证 SDK 是否能够正常工作，还能帮助开发者快速上手，完成从 **任务创建** 到 **3D 重建** 的完整流程。

### 运行测试脚本

```sh
yarn test
```

## 贡献

欢迎提交 Issue 和 Pull Request 参与改进！

## 许可证

MIT License
