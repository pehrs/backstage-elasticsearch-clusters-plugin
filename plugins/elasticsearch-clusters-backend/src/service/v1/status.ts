import { EsConfig } from '../config'
import { getEsCat } from '../util/escat'


export async function getStatus(esConfig: EsConfig | undefined, res) {
  const promises: Promise<any>[] | undefined = esConfig?.cluster_links?.flatMap(cluster_link => {
    if (esConfig?.regions) {
      return esConfig?.regions?.flatMap(region => {
        const url = cluster_link.replace("{region}", region);
        return [
          getEsCat("health", url)
            .then(res => {
              res["region"] = region;
              return res;
            }),
          getEsCat("indices", url)
            .then(res => {
              res["region"] = region;
              return res;
            }),
          getEsCat("aliases", url)
            .then(res => {
              res["region"] = region;
              return res;
            }),
        ];
      });
    } else {
      return [
        getEsCat("health", cluster_link).then(res => res["region"] = "details"),
        getEsCat("indices", cluster_link).then(res => res["region"] = "details"),
        getEsCat("aliases", cluster_link).then(res => res["region"] = "details"),
      ];
    }
  });

  if (promises) {
    const successful = (await Promise.all(promises)).flatMap(res => {
      console.log("response", res);

      if (res["state"] === "ERROR") {
        console.log("ERROR:", res);
        return [];
      }
      return [res];
    });
    // console.log("successful", successful);

    const clusterStatus: any = {};
    successful.forEach(response => {
      const cat_name = response["cat_name"];
      const cluster_link = response["cluster_link"];
      const region = response["region"];

      var theClusterObject: any = {};
      if (cluster_link in clusterStatus) {
        theClusterObject = clusterStatus[cluster_link];
      } else {
        clusterStatus[cluster_link] = theClusterObject;
      }
      var theRegionObject: any = {};
      if (region in theClusterObject) {
        theRegionObject = theClusterObject[region];
      } else {
        theClusterObject[region] = theRegionObject;
      }

      theRegionObject[cat_name] = response;

      // const cluster_name = response["cluster"];
      // var theObject: any = {};
      // if (cluster_name in clusterStatus) {
      //   theObject = clusterStatus[cluster_name];
      // } else {
      //   clusterStatus[cluster_name] = theObject;
      // }
      // theObject[region] = response;
    });

    res.status(200).json({
      status: "ok",
      esConfig: esConfig,
      clusterStatus: clusterStatus,
    });
  } else {
    // Empty result
    res.status(200).json({
      status: "ok",
      esConfig: esConfig,
      clusterStatus: [],
    });
  }
}