# Terra API SDK for Node.js

## 介绍

**Terra API SDK** 是一个用于封装 **大疆智图 API** 的 Node.js SDK，提供了简单易用的接口，帮助开发者免去繁琐的 API 调用签名过程，直接通过 SDK 发送请求。

此外，该 SDK 还提供了 **TypeScript 类型声明文件**，使 TypeScript 开发者可以通过类型检查确保请求参数和返回值的正确性，从而提高开发效率并减少错误。

## 特性

- **简化 API 调用**：封装复杂的签名计算，开发者无需手动计算 API 请求签名。
- **TypeScript 支持**：提供完整的 TypeScript 类型声明，增强代码可靠性和可维护性。
- **完整测试流程脚本**：提供示例脚本，可用于快速学习和实际使用 SDK 进行 3D 重建。

## 安装

使用 npm 或 yarn 进行安装：

```sh
npm install @nnsay/dji-terra-api-sdk
yarn add @nnsay/dji-terra-api-sdk
```

## 快速开始

参考：test/full-step.ts

```typescript
import {
  CreateJobAPIResponse,
  StartJob3DParamater,
  TerraAPI,
} from 'dji-terra-api-sdk';
import os from 'os';

const exec = async () => {
  // AK/SK come from env prameter
  const terraAPI = new TerraAPI();
  // or AK/SK hardcode
  // const terraAPI = new TerraAPI(appKey, secretKey, 'https://openapi-cn.dji.com');

  // TODO: change the dir to you drone image dir
  const imageDir = `${os.homedir()}/Downloads/tmp/test/images`;
  const apiOutputDir = `${os.homedir()}/Downloads/tmp/test/terra-api-result`;

  // 1. Get STS Token for upload files
  const stsToken = await terraAPI.obtainToken();
  // 2. Upload drone images to tmp
  const uploadedFiles = await terraAPI.uploadFile(stsToken, imageDir);
  // 3. Create resource
  const resource = await terraAPI.createResource({
    name: 'test-obj',
    type: 'map',
  });
  // 4. Bind the uploaded files and resource
  await terraAPI.uploadCallback(
    stsToken.callbackParam,
    uploadedFiles,
    resource.uuid,
  );
  // 5. Create job
  const job = await terraAPI.createJob({ name: `job-test-obj` });
  // 6. Start job with custom parameters
  await terraAPI.startJob<StartJob3DParamater>(job.uuid, {
    parameters: {
      parameter: {
        // Texture model result parameter
        generate_ply: false,
        generate_b3dm: false,
        generate_obj: true,
      },
    },
    resourceUuid: resource.uuid,
    type: 15,
  });
  // 7. Check job status
  let checkJob: CreateJobAPIResponse;
  const sleep = (seconds = 10) =>
    new Promise((resolve) => setTimeout(() => resolve(true), seconds * 1000));
  do {
    checkJob = await terraAPI.getJob(job.uuid);
    await sleep();
  } while (checkJob.status < 6);
  if (checkJob.status == 7) {
    throw new Error('terra api job execution fail');
  }
  // 8. Downlaod 3D output
  await terraAPI.downloadFiles(checkJob.outputResourceUuid, apiOutputDir);
};

exec().catch((err) => {
  console.debug(err);
  console.error(err.response?.data);
});
```

## 测试脚本

由于该 SDK 仅对 **大疆智图 API** 进行封装，不包含额外的自定义逻辑，因此没有采用代码测试框架或覆盖率工具。

在 `test` 目录下，提供了一个完整的 **测试脚本**，它不仅可以用于验证 SDK 是否能够正常工作，还能帮助开发者快速上手，完成从 **任务创建** 到 **3D 重建** 的完整流程。

### 运行测试脚本

```sh
yarn test
```
