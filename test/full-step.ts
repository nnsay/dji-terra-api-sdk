import os from 'os';
import { TerraAPI } from '../src/main';
import { StartJob3DParamater, CreateJobAPIResponse } from '../src/dto';

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
