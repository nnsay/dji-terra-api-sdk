import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import crypto from 'crypto';
import url from 'url';
import axios, { AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import {
  TerraAPIResponse,
  ObtainTokenAPIResponse,
  UploadCallbackAPIResponse,
  CreateResourceAPIResponse,
  GetResourceAPIResponse,
  ListResourcesAPIResponse,
  CreateJobAPIResponse,
  StartJobAPIRequest,
  ListFilesAPIResponse,
  GetFileAPIResponse,
} from './dto';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

/**
 * Terra API
 */
export class TerraAPI {
  private appKey: string;
  private secretKey: string;

  private apiHost;
  private headers = 'date @request-target digest';
  private algorithm = 'hmac-sha256';

  private readonly reqClient = axios.create();

  constructor(
    appKey = process.env.DJI_APP_KEY,
    secretKey = process.env.DJI_SECRET_KEY,
    apiHost = 'https://openapi-cn.dji.com',
  ) {
    if (!appKey || !secretKey) {
      throw new Error('DJI_APP_KEY or DJI_SECRET_KEY is not set');
    }
    this.appKey = appKey;
    this.secretKey = secretKey;
    this.apiHost = apiHost;
    axiosRetry(this.reqClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
  }

  private getFormattedDate() {
    return dayjs().utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]');
  }

  private calculateDigest(payloadStr: string) {
    return crypto
      .createHash('sha256')
      .update(payloadStr, 'utf-8')
      .digest()
      .toString('base64');
  }

  private generateSignature(signingStr: string) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signingStr, 'utf-8')
      .digest()
      .toString('base64');
  }

  private buildRequestParam(method: string, reqUrl: string, payload: unknown) {
    const requestTarget = `${method} ${url.parse(reqUrl).path}`;

    const payloadStr =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    const digest = this.calculateDigest(payloadStr);

    const date = this.getFormattedDate();

    const signingStr = `date: ${date}\n@request-target: ${requestTarget}\ndigest: SHA-256=${digest}`;
    const signature = this.generateSignature(signingStr);

    const headers = {
      Date: date,
      Authorization: `hmac username="${this.appKey}", algorithm="${this.algorithm}", headers="${this.headers}", signature="${signature}"`,
      Digest: `SHA-256=${digest}`,
      'Content-Type':
        payloadStr === '' ? undefined : 'application/json;charset=UTF-8',
    };
    return { headers, payloadStr };
  }

  private async traverseDirectory(rootDir: string) {
    const files: string[] = [];

    const traverse = async (dirPath: string) => {
      const fileOrDirNames = await fs.readdir(dirPath);
      for (const fileOrDirName of fileOrDirNames) {
        const filePath = path.resolve(path.join(dirPath, fileOrDirName));
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await traverse(filePath);
        } else {
          files.push(path.relative(rootDir, filePath));
        }
      }
    };
    await traverse(rootDir);

    return files;
  }

  /**
   * Get token
   * @returns STS token
   */
  async obtainToken() {
    const payload = '';
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/store/obtain_token`;
    const method = 'POST'.toLowerCase();
    const { headers, payloadStr: payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<ObtainTokenAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });
    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    const stsToken = data.data;
    console.log(`[obtainToken]: ${JSON.stringify(stsToken)}`);
    return stsToken;
  }

  /**
   * Upload complete callback
   * @param callbackParam string, callback parameter which comes from sts token
   * @param uploadedFiles list, the list of uploaded files etag result
   * @param resourceUUID string, resource id
   * @returns resource file list
   */
  async uploadCallback(
    callbackParam: string,
    uploadedFiles: { name: string; etag: string; checksum: string }[],
    resourceUUID: string,
  ) {
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/store/upload_callback`;
    const method = 'POST'.toLowerCase();
    const maxCallbackFileCount = 50;
    let resoruceFiles: UploadCallbackAPIResponse[] = [];
    while (uploadedFiles.length) {
      const files = uploadedFiles.splice(0, maxCallbackFileCount);
      const payload: {
        callbackParam: string;
        files: {
          checksum: string;
          etag: string;
          meta?: string;
          name: string;
          position?: { attitude: number; latitude: number; longitude: number };
        }[];
        resourceUUID: string;
      } = {
        callbackParam,
        files,
        resourceUUID,
      };
      const { headers, payloadStr } = this.buildRequestParam(
        method,
        reqUrl,
        payload,
      );
      const res = await this.reqClient.request<
        string,
        AxiosResponse<TerraAPIResponse<UploadCallbackAPIResponse[]>>
      >({
        url: reqUrl,
        method: method,
        headers,
        data: payloadStr,
      });
      if (res.data.result.code !== 0) {
        throw new Error(res.data.result.msg);
      }
      console.log(`[uploadCallback]: ${JSON.stringify(res.data.data)}`);
      resoruceFiles = resoruceFiles.concat(res.data.data);
    }
    return resoruceFiles;
  }

  /**
   * Upload file
   * @param stsToken STS token, comes from get token api
   * @param imageDir local file root directory
   * @returns uploaded files etag list
   */
  async uploadFile(stsToken: ObtainTokenAPIResponse, imageDir: string) {
    const s3Config: S3ClientConfig = {
      region: stsToken.region,
      credentials: {
        accessKeyId: stsToken.accessKeyID,
        secretAccessKey: stsToken.secretAccessKey,
        sessionToken: stsToken.sessionToken,
      },
    };
    if (this.apiHost.includes('-cn')) {
      s3Config.endpoint = `https://${stsToken.region}.aliyuncs.com`;
      // @ts-expect-error: skip the readonly checking
      s3Config.apiVersion = '2006-03-01';
    }
    const ossClient = new S3Client(s3Config);
    const uploadedFiles: { name: string; etag: string; checksum: string }[] =
      [];
    const files = await this.traverseDirectory(path.resolve(imageDir));
    const concurrent = 50;

    while (files.length) {
      const currentBatchFiles = files
        .splice(0, concurrent)
        .filter((file) => /.*(jpg|jpeg|dng|heic|heif)$/i.test(file));

      const batchUpload = currentBatchFiles.map(async (file) => {
        const key = stsToken.storePath.replace('{fileName}', file);
        const { ETag } = await ossClient.send(
          new PutObjectCommand({
            Bucket: stsToken.cloudBucketName,
            Key: key,
            Body: createReadStream(path.resolve(`${imageDir}/${file}`)),
          }),
        );
        console.log(`[uploadFile] ${key} ${ETag}`);
        uploadedFiles.push({ name: file, etag: ETag!, checksum: ETag! });
      });
      await Promise.all(batchUpload);
    }

    console.log(`[uploadFile] ${JSON.stringify(uploadedFiles)}`);

    return uploadedFiles;
  }

  /**
   * Create resource
   * @param payload json, create resource parameters
   * - meta?, string, user extension information
   * - files?, string[], the file uuid to be added to the resource
   * - name, string, resource name
   * - type, string, resource type, available values : map
   * @returns resource information
   */
  async createResource(payload: {
    meta?: string;
    files?: string[];
    name: string;
    type: 'map';
  }) {
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/resources`;
    const method = 'POST'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<CreateResourceAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers: { ...headers, 'Return-Detail': true },
      data: payloadStr,
    });
    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    const resource = data.data;
    console.log(`[createResource] ${JSON.stringify(resource)}`);
    return resource;
  }

  /**
   * Delete resource
   * @param resourceUUID string, resource uuid
   * @param deleteMode delete mode. 0 - do not delete. 1 - delete files that are not linked to other resource. uint
   * @returns execute result
   */
  async deleteResource(resourceUUID: string, deleteMode: 0 | 1 = 0) {
    const payload = '';
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/resources/${resourceUUID}?deleteMode=${deleteMode}`;
    const method = 'DELETE'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    // const { 'Content-Type': contentType, ...otherHeaders } = headers
    const res = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (res.data.result.code !== 0) {
      throw new Error(res.data.result.msg);
    }
    console.log(`[deleteResource] ${JSON.stringify(res.data.result)}`);
    return res.data.result;
  }

  /**
   * Get resource information
   * @param uuid resource uuid
   * @return resource information
   */
  async getResource(uuid: string) {
    const payload = '';
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/resources/${uuid}`;
    const method = 'GET'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<GetResourceAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    console.log(`[getResource] ${JSON.stringify(data.data)}`);
    return data.data;
  }

  /**
   * Get resource list
   * @param query json, query parameters
   * - rows?: page rows. uint
   * - page?: page code. Starting from 1. uint
   * - search?: search option
   * - uuids?: get resource list with specified uuid. The uuids are separated by ",".
   * - type?: pecify the resource type to search for, available values : map
   * @return resource paged list
   */
  async listResources(
    query: {
      rows?: number;
      page?: number;
      search?: string;
      uuids?: string;
      type?: 'map';
    } = { rows: 10 },
  ) {
    const urlParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      urlParams.append(key, String(value));
    });
    const payload = '';
    const reqUrl =
      `${this.apiHost}/terra-rescon-be/v2/resources?=` + urlParams.toString();
    const method = 'GET'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<ListResourcesAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    console.log(`[listResources] ${JSON.stringify(data.data)}`);
    return data.data;
  }

  /**
   * Create job
   * @param payload json, job parameters
   * - meta?, string, User extension information
   * - name, string, Job name
   * @returns job details
   */
  async createJob(payload: { meta?: string; name: string }) {
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/jobs`;
    const method = 'POST'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<CreateJobAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers: { ...headers, 'Return-Detail': true },
      data: payloadStr,
    });
    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    const job = data.data;
    console.log(`[createResource] ${JSON.stringify(job)}`);
    return job;
  }
  /**
   * Get job details
   * @param uuid string, job ID
   * @returns job details
   */
  async getJob(uuid: string) {
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/jobs/${uuid}`;
    const payload = '';
    const method = 'GET'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<CreateJobAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });
    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    const job = data.data;
    console.log(`[getJob] ${JSON.stringify(job)}`);
    return job;
  }

  /**
   * Start job
   * @param uuid job id
   * @param payload json, start job parameters
   * - outputResourceUuid?: string, When the type is 4, you can specify the output resource, indicating the merging into that resource.
   * - parameters: string, json, reference: https://developer.dji.com/doc/terra_api_tutorial/cn/terra-cloud-algo.html
   *   - parameters.parameter: json, the configuration of 2D, 3D, and LiDAR reconstruction jobs
   *   - parameters.predefine_AOI?: json, is an optional parameter, and is at the same level as the parameter. The predefine_AOI parameter only takes effect in 2D and 3D jobs.
   *   - parameters.export_parameter?: json, is optional and sets the directory structure and content of reconstruction output.
   * - resourceUuid: string, Resource uuid
   * - type: 13 | 14 | 15, Job type. 14 - 2D reconstruction, 15 - 3D reconstruction, 13 - LiDAR reconstruction
   * @returns execute result
   */
  async startJob<T>(uuid: string, payload: StartJobAPIRequest<T>) {
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/jobs/${uuid}/start`;
    const method = 'POST'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(method, reqUrl, {
      ...payload,
      parameters: JSON.stringify(payload.parameters),
    });
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });
    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    const result = data.result;
    console.log(`[startJob] ${JSON.stringify(result)}`);
    return result;
  }
  /**
   * Get file list
   * @param query json, query Paramater
   * - rows?: number, page rows. uint
   * - page?: number, page code. Starting from 1. uint
   * - search?: string, search option
   * - uuids?: string, get file list with specified uuid. IDs are separated by ",". UUID is a 36-character string, with a maximum support of 1000 UUIDs
   * - type?: number, job type. 14 - 2D reconstruction, 15 - 3D reconstruction, 13 - LiDAR reconstruction
   * - originResourceUuid?: string, origin resource uuid
   * - outputResourceUuid?: string, resource uuid of reconstruction result
   * @return file paged list
   */
  async listJobs(
    query: {
      rows?: number;
      page?: number;
      search?: string;
      uuids?: string;
      type?: number;
      originResourceUuid?: string;
      outputResourceUuid?: string;
    } = { rows: 10 },
  ) {
    const urlParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      urlParams.append(key, String(value));
    });
    const payload = '';
    const reqUrl =
      `${this.apiHost}/terra-rescon-be/v2/files?=` + urlParams.toString();
    const method = 'GET'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<CreateJobAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    console.log(`[listJobs] ${JSON.stringify(data.data)}`);
    return data.data;
  }

  /**
   * Get file list
   * @param query json, query Paramater
   * - rows?: number, page rows. uint
   * - page?: number, page code. Starting from 1. uint
   * - search?: string, search option
   * - needURL?: boolean
   * - name?: string
   * - uuids?: string, get file list with specified uuid. IDs are separated by ",". UUID is a 36-character string, with a maximum support of 1000 UUIDs
   * - resourceUuid?: string, Linked resource uuid
   * - orderAsc?: boolean, The default sorting order for Files is descending based on created_at. When this condition is set to true, the results are returned in ascending order.
   * @return file paged list
   */
  async listFiles(
    query: {
      rows?: number;
      page?: number;
      search?: string;
      needURL?: boolean;
      name?: string;
      uuids?: string;
      resourceUuid?: string;
      orderAsc?: boolean;
    } = { rows: 10 },
  ) {
    const urlParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      urlParams.append(key, String(value));
    });
    const payload = '';
    const reqUrl =
      `${this.apiHost}/terra-rescon-be/v2/files?=` + urlParams.toString();
    const method = 'GET'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<ListFilesAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    console.log(`[listFiles] ${JSON.stringify(data.data)}`);
    return data.data;
  }
  /**
   * Get file information
   * @param uuid, string, file id
   * @returns file information
   */
  async getFile(uuid: string) {
    const payload = '';
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/files/${uuid}`;
    const method = 'GET'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse<GetFileAPIResponse>>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    console.log(`[getFile] ${JSON.stringify(data.data)}`);
    return data.data;
  }

  /**
   * Delete file
   * @param uuid, string, file id
   * @returns execute result
   */
  async deleteFile(uuid: string) {
    const payload = '';
    const reqUrl = `${this.apiHost}/terra-rescon-be/v2/files/${uuid}`;
    const method = 'DELETE'.toLowerCase();
    const { headers, payloadStr } = this.buildRequestParam(
      method,
      reqUrl,
      payload,
    );
    const { data } = await this.reqClient.request<
      string,
      AxiosResponse<TerraAPIResponse>
    >({
      url: reqUrl,
      method: method,
      headers,
      data: payloadStr,
    });

    if (data.result.code !== 0) {
      throw new Error(data.result.msg);
    }
    console.log(`[deleteFile] ${JSON.stringify(data.data)}`);
    return data.data;
  }

  /**
   * Download files
   * @param outputResourceUuid, string, output resource id
   * @param rootDir, string, download root directory
   * @returns void
   */
  async downloadFiles(outputResourceUuid: string, rootDir: string) {
    const { fileUuids } = await this.getResource(outputResourceUuid);
    const downloadDir = path.resolve(rootDir);
    const maxDownloadFileCount = 100;
    while (fileUuids.length) {
      const batchFiles = fileUuids.splice(0, maxDownloadFileCount);
      const downlaodFileTasks = batchFiles.map(async (uuid) => {
        const fileInfo = await this.getFile(uuid);
        const fileStream = await this.reqClient.get(fileInfo.url, {
          responseType: 'arraybuffer',
        });
        const downlaodFilePath = path.resolve(downloadDir, fileInfo.name);
        await fs.mkdir(path.dirname(downlaodFilePath), { recursive: true });
        await fs.writeFile(downlaodFilePath, fileStream.data);
        console.log(`[downloadFiles] ${fileInfo.name} downlaod done`);
      });
      await Promise.all(downlaodFileTasks);
    }
    console.log(`[downloadFiles] all files download done`);
  }
}

const exec = async () => {
  const terraAPI = new TerraAPI();
  await terraAPI.listResources();
};
exec().catch((err) => console.error(err.result));
