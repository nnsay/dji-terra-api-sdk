/**
 * Terra API Interface Type
 */
export interface TerraAPIResponse<T = undefined> {
  result: {
    /**
     * Error code. 0 means success. int type
     * - 701 - authentication error
     * - 801 - job number limit
     * - 102000 - service invocation failure
     * - 102001 - parameter error
     * - 102002 - can not find resource
     * - 102003 - invalid operation
     * - 102114 - job does not exist
     * - 102116 - billing failure
     * For more details, please refer to the returned error message.
     */
    code: number;
    /**
     * Error code description
     */
    desc: string;
    /**
     * Error message
     */
    msg: string;
  };
  data: T;
}
export interface ObtainTokenAPIResponse {
  accessKeyID: string;
  /**
   * Callback parameter
   */
  callbackParam: string;
  cloudBucketName: string;
  /**
   * For AWS_S3, ALI_OSS and AZURE_BLOB, only AWS_S3 and ALI_OSS are supported.
   */
  cloudName: string;
  /**
   * Expiration time, timestamp in seconds. int64
   */
  expireTime: number;
  region: string;
  secretAccessKey: string;
  sessionToken: string;
  /**
   * "xxxxxxxxx/{fileName}"，将 "{fileName}" 替换为文件名
   */
  storePath: string;
}
export interface CreateResourceAPIResponse {
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  createdAt: string;
  /**
   * Download time. Unit is second. float64
   */
  downloadUsedTime: number;
  /**
   * Included file number. uint
   */
  fileCount: number;
  /**
   * User extension information
   */
  meta: string;
  /**
   * Resource name
   */
  name: string;
  /**
   * Whether is modifiable
   */
  revisable: boolean;
  scope: {
    /**
     * Maximum latitude. float64
     */
    maxLatitude: number;
    /**
     * Maximum longitude. float64
     */
    maxLongitude: number;
    /**
     * Minimum latitude. float64
     */
    minLatitude: number;
    /**
     * Minimum longitude. float64
     */
    minLongitude: number;
  };
  /**
   * Included total file size. Unit is byte. uint
   */
  totalSize: number;
  /**
   * Resource type
   */
  type: 'map';
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  updatedAt: string;
  /**
   * Upload time. Unit is second. float64
   */
  uploadUsedTime: number;
  /**
   * Resource uuid
   */
  uuid: string;
}
export interface GetFileAPIResponse {
  /**
   * checksum
   */
  checksum: string;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  createdAt: string;
  /**
   * User extension information
   */
  meta: string;
  /**
   * File name
   */
  name: string;
  position: {
    /**
     * Attitude, float32
     */
    attitude: number;
    /**
     * Latitude, float64
     */
    latitude: number;
    /**
     * Longitude, float64
     */
    longitude: number;
  };
  /**
   * File size. Unit is byte. uint64
   */
  size: number;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  updatedAt: string;
  /**
   * Download link
   */
  url: string;
  /**
   * File uuid
   */
  uuid: string;
}
export interface ListFilesAPIResponse {
  list: GetFileAPIResponse[];
  /**
   * Page code. uint
   */
  page: number;
  /**
   * Page rows. uint
   */
  rows: number;
  /**
   * Total record number. uint
   */
  total: number;
}
export interface ListResourcesAPIResponse {
  list: {
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
     */
    createdAt: string;
    /**
     * Download time. Unit is second. float64
     */
    downloadUsedTime: number;
    /**
     * Included file number. uint
     */
    fileCount: number;
    /**
     * User extension information
     */
    meta: string;
    /**
     * Resource name
     */
    name: string;
    /**
     * Whether is modifiable
     */
    revisable: boolean;
    scope: {
      /**
       * Maximum latitude. float64
       */
      maxLatitude: number;
      /**
       * Maximum longitude. float64
       */
      maxLongitude: number;
      /**
       * Minimum latitude. float64
       */
      minLatitude: number;
      /**
       * Minimum longitude. float64
       */
      minLongitude: number;
    };
    /**
     * Included total file size. Unit is byte. uint
     */
    totalSize: number;
    /**
     * Resource type
     */
    type: 'map' | 'job_output';
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
     */
    updatedAt: string;
    /**
     * Upload time. Unit is second. float64
     */
    uploadUsedTime: number;
    /**
     * Resource uuid
     */
    uuid: string;
  }[];
  /**
   * Page code. uint
   */
  page: number;
  /**
   * Page rows. uint
   */
  rows: number;
  /**
   * Total record number. uint
   */
  total: number;
}
export interface GetResourceAPIResponse {
  summary: {
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
     */
    createdAt: string;
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
     */
    updatedAt: string;
    /**
     * Resource name
     */
    name: string;
    /**
     * Resource type
     */
    type: 'map' | 'job_output';
    /**
     * User extension information
     */
    meta: string;
    /**
     * Included file number. uint
     */
    fileCount: number;
    /**
     * Included total file size. Unit is byte. uint
     */
    totalSize: number;
    scope: {
      /**
       * Maximum latitude. float64
       */
      maxLatitude: number;
      /**
       * Maximum longitude. float64
       */
      maxLongitude: number;
      /**
       * Minimum latitude. float64
       */
      minLatitude: number;
      /**
       * Minimum longitude. float64
       */
      minLongitude: number;
    };
    revisable: boolean;
    /**
     * Download time. Unit is second. float64
     */
    downloadUsedTime: number;
    /**
     * Upload time. Unit is second. float64
     */
    uploadUsedTime: number;
    /**
     * Resource uuid
     */
    uuid: string;
  };
  fileUuids: string[];
  inputJobUuids: string[];
  outputJobUuids: string[];
}
export interface UploadCallbackAPIResponse {
  /**
   * checksum
   */
  checksum: string;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  createdAt: string;
  /**
   * User extension information
   */
  meta: string;
  /**
   * File name
   */
  name: string;
  position: {
    /**
     * Attitude, float32
     */
    attitude: number;
    /**
     * Latitude, float64
     */
    latitude: number;
    /**
     * Longitude, float64
     */
    longitude: number;
  };
  /**
   * File size. Unit is byte. uint64
   */
  size: number;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  updatedAt: string;
  /**
   * Download link
   */
  url: string;
  /**
   * File uuid
   */
  uuid: string;
}
export interface CreateJobAPIResponse {
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned
   */
  completedAt?: string;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  createdAt: string;
  /**
   * Status information. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned
   */
  message?: string;
  /**
   * User extension information
   */
  meta: string;
  /**
   * 	Job name
   */
  name: string;
  /**
   * Origin resource uuid. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned.
   */
  originResourceUuid?: string;
  /**
   * Uuid of resource that stores the reconstruction result. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned.
   *
   */
  outputResourceUuid?: string;
  /**
   * This field is not mandatory to be returned. For example, if the job has not been initiated, this field will not be returned.
   */
  parameters?: string;
  /**
   * Progress. From 0 to 1. float64. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned.
   */
  percentage?: number;
  /**
   * Total pixels. float64. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned.
   */
  pixels?: number;
  /**
   * Remaining time. Unit is second. int. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned.
   */
  remainSeconds?: number;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00. This field is not mandatory to be returned.
   * For example, if the job has not been initiated, this field will not be returned.
   */
  startedAt?: string;
  /**
   * Job status
   * - 0 - waiting for start
   * - 1 - waiting
   * - 2 - preparing
   * - 3 - executing
   * - 4 - result processing
   * - 5 - stopped
   * - 6 - execution finished
   * - 7 - execution fail. uint
   */
  status: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /**
   * Job type. 14 - 2D reconstruction, 15 - 3D reconstruction, 13 - LiDAR reconstruction
   */
  type: 14 | 15 | 13;
  /**
   * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
   */
  updatedAt: string;
  /**
   * Job uuid
   */
  uuid: string;
}
/**
 * 公共部分: https://developer.dji.com/doc/terra_api_tutorial/cn/terra-cloud-algo.html#%E5%85%AC%E5%85%B1%E9%83%A8%E5%88%86
 */
export interface StartJobCommonParamater {
  // Aerotriangulation Processing Parameter
  /**
   * Aerotriangulation algorithm. Optional values: "GLOBAL", "INCREMENTAL"
If the majority of the images have precise locations with RTK (Real-Time Kinematic) data, "GLOBAL" is recommended. If the images have no GPS, "INCREMENTAL" is recommended.
   */
  SfM_method?: 'GLOBAL' | 'INCREMENTAL';
  /**
   * Maximum number of feature points. The optional values are 1, 2, 3. They respectively represent 4w, 2w, 9k.
   */
  sfm_feature_quantity_level?: 1 | 2 | 3;
  use_image_position?: boolean;
  // Aerotriangulation Result Parameter
  generate_blocks_exchange_xml?: boolean;
  blocks_exchange_xml_geo_desc?: Map<string, any>;
  // Point Cloud Result Parameter
  output_pointcloud?: boolean;
  generate_pnts?: boolean;
  generate_las?: boolean;
  generate_point_s3mb?: boolean;
  generate_point_ply?: boolean;
  /**
   * Whether to generate point cloud model in pcd format.
   */
  generate_pcd?: boolean;
  /**
   * Whether to merge the point cloud into one file.
   */
  merge_point?: boolean;
}
/**
 * 2D 重建算法参数: https://developer.dji.com/doc/terra_api_tutorial/cn/terra-cloud-algo.html#_3d-%E9%87%8D%E5%BB%BA%E7%AE%97%E6%B3%95%E5%8F%82%E6%95%B0
 */
export interface StartJob2DParamater extends StartJobCommonParamater {
  // 2D reconstruction parameter
  /**
   * Stitching image mode. Option values 0, 1, 2 correspond to farmland mode, city mode, orchard mode respectively.
   */
  map_mode: 0 | 1 | 2;
  /**
   * Option values 1, 2, 3 correspond to high precision, medium precision, low precision respectively.
   */
  quality_level?: 1 | 2 | 3;
  /**
   * Whether to open uniforming color within the image.
   * Suggested to enable when there is inconsistent brightness within a single image. It may result in contrast loss. Please use with caution.
   */
  use_Wallis?: boolean;
  /**
   * 	Whether to enable image dehazing. It is recommended to enable when there is fog or haze in the captured images.
   */
  use_Dehaze?: boolean;
  /**
   * Whether to use the National Geomatics Center coordinate system, only effective for map tiles.
   */
  use_gcj02?: boolean;
  /**
   * When this field is greater than 0, output results in blocks, indicating the DOM pixel size of a single block. This parameter must be a multiple of 2.
   */
  dom_tile_size?: number;
  /**
   * Output coordinate system description. The format can be read from the "Geographic Coordinate System" table. Default {} represents no specified output coordinate system. The system will be automatically determined.
   */
  output_geo_desc?: Map<string, any>;
}
/**
 * 3D 重建算法参数: https://developer.dji.com/doc/terra_api_tutorial/cn/terra-cloud-algo.html#_3d-%E9%87%8D%E5%BB%BA%E7%AE%97%E6%B3%95%E5%8F%82%E6%95%B0
 */
export interface StartJob3DParamater extends StartJobCommonParamater {
  // Texture model result parameter
  /**
   * Whether to generate mesh When this item is set to true, the texture model result parameter takes effect.
   */
  output_mesh?: boolean;
  /**
   * Whether to generate texture model in ply format.
   */
  generate_ply?: boolean;
  /**
   * Whether to generate texture model in obj format.
   */
  generate_obj?: boolean;
  /**
   * Whether to generate mesh LOD model in b3dm format. The model can be viewed by Terra software or Cesium webpage.
   */
  generate_b3dm?: boolean;
  /**
   * Whether to generate mesh LOD model in osgb format.
   */
  generate_osgb?: boolean;
  /**
   * Whether to generate mesh LOD model in s3mb format. The model can be viewed by SuperMap GIS software.
   */
  generate_s3mb?: boolean;
  /**
   * Whether to generate mesh LOD model in i3s format. The model can be viewed by ArcGIS software.
   */
  generate_i3s?: boolean;
  /**
   * Whether to enable water surface smoothing.
   * It is recommended to enable when there is a large water area in the survey region that needs reconstruction.
   */
  water_refine?: boolean;
  /**
   * Simplify the number of model patches to a specified ratio (e.g., 0.2 corresponds to 20%).
   * It is recommended to set this to a value less than 1 when using the LOD model for lightweight web browsing.The range is [0.05-1]. 1 represents no simplification.
   */
  model_simplify?: number;
  // Common parameter of point cloud and texture model
  cut_AOI?: boolean;
  /**
   * The detail level of reconstruction. Option values 1, 2, 3 correspond to high precision, medium precision, low precision respectively.
   */
  quality_level?: 1 | 2 | 3;
  output_geo_desc?: Map<string, any>;
}
/**
 * LiDAR 重建算法参数: https://developer.dji.com/doc/terra_api_tutorial/cn/terra-cloud-algo.html#lidar-%E9%87%8D%E5%BB%BA%E7%AE%97%E6%B3%95%E5%8F%82%E6%95%B0
 */
export interface StartJobLiDARParamater extends StartJobCommonParamater {
  // Common processing parameter
  colorize_point?: boolean;
  lpp_optimise?: boolean;
  refine_calibrate?: number;
  lidar_point_max_distance?: number;
  smooth_point?: boolean;
  sample_distance?: number;
  output_height_offset?: number;
  /**
   * Sampling rate for temporal downsampling of the point cloud. Option values 1, 2, 3 correspond to 100%, 25%, 6.25%.
   * It conflicts with the setting of `sample_distance`. Typically, choose either voxel downsampling or temporal downsampling.
   */
  quality_level?: 1 | 2 | 3;
  output_geo_desc?: Map<string, any>;
  // Ground point extraction parameter
  ground_extract?: boolean;
  /**
   * Ground scene type. Option values 0, 1, 2 correspond to flat ground, slope and gentle slope.
   */
  scene_type?: 0 | 1 | 2;
  max_size_building?: number;
  iter_dist?: number;
  iter_angle?: number;
  // DEM result parameter
  generate_dem?: boolean;
  dem_resolution?: number;
}
export interface StartJobAPIRequest<T> {
  outputResourceUuid?: string;
  /**
   * Please read https://developer.dji.com/doc/terra_api_tutorial/en/terra-cloud-algo.html
   */
  parameters: {
    parameter: T;
    // Region of interest
    predefine_AOI?: {
      max_altitude?: number;
      min_altitude?: number;
      polygon_points?: [number, number, number][];
      geo_desc?:
        | {
            cs_type: 'GEO_CS' | 'LOCAL_CS' | 'LOCAL_ENU_CS';
            geo_cs_wkt?: string;
            offset?: [number, number, number];
          }
        | {
            cs_type: 'GEO_CS' | 'LOCAL_CS' | 'LOCAL_ENU_CS';
            geo_cs?: string;
            override_vertical_cs?: string;
            offset?: [number, number, number];
          }
        | {
            cs_type: 'GEO_CS' | 'LOCAL_CS' | 'LOCAL_ENU_CS';
            offset?: [number, number, number];
            ref_GPS?: { altitude: number; latitude: number; longitude: number };
          };
    };
    // Export Parameter
    export_parameter?: {
      /**
       * Whether to keep the directory of cloud reconstruction output consistent with that of the local Terra software output and allow export files to be imported into Terra.
       */
      pc_dir_structure?: boolean;
      /**
       * Whether to export the undistorted photos generated during the reconstruction process. This parameter is not supported for LiDAR point cloud tasks.
       */
      undistort_images?: boolean;
      /**
       * Whether to export intermediate result files generated during the reconstruction process, which will occupy a large amount of storage space.
       */
      temp_result_files?: boolean;
    };
  };
  /**
   * Resource uuid
   */
  resourceUuid: string;
  /**
   * Job type. 14 - 2D reconstruction, 15 - 3D reconstruction, 13 - LiDAR reconstruction
   */
  type: 13 | 14 | 15;
}
export interface ListJobAPIResponse {
  list: {
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00.
     * This field is not mandatory to be returned. For example, if the job has not been initiated, this field will not be returned.
     */
    completedAt?: string;
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
     */
    createdAt: string;
    /**
     * User extension information
     */
    meta: string;
    /**
     * Job name
     */
    name: string;
    /**
     * Origin resource uuid. This field is not mandatory to be returned.
     * For example, if the job has not been initiated, this field will not be returned.
     */
    originResourceUuid?: string;
    /**
     * Uuid of resource that stores the reconstruction result.
     * This field is not mandatory to be returned. For example, if the job has not been initiated, this field will not be returned.
     */
    outputResourceUuid?: string;
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00.
     * This field is not mandatory to be returned. For example, if the job has not been initiated, this field will not be returned.
     */
    startedAt?: string;
    /**
     * Job status. 0 - waiting for start. 1 - waiting. 2 - preparing. 3 - executing. 4 - result processing. 5 - stopped. 6 - execution finished. 7 - execution fail. uint
     */
    status: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    /**
     * Job type. 14 - 2D reconstruction, 15 - 3D reconstruction, 13 - LiDAR reconstruction
     */
    type: 13 | 14 | 15;
    /**
     * The time format is RFC3339. For example, 2006-01-02T15:04:05Z07:00
     */
    updatedAt: string;
    /**
     * Job uuid
     */
    uuid: string;
  }[];
  /**
   * Page code. uint
   */
  page: number;
  /**
   * Page rows. uint
   */
  rows: number;
  /**
   * Total record number. uint
   */
  total: number;
}
