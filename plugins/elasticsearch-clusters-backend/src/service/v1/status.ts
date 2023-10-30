import { EsConfig } from '../config'

function getEsCat(cat_name:string, cluster_link: string, region: string): Promise<any> {
    return fetch(new URL(`${cluster_link}/_cat/${cat_name}?format=json`))
      .then(response => response.json())
      .then(theJson => {
        // FIXME: Why is theJson an array?
        return {
          cat_name: cat_name,
          state: "ok",
          cluster_link: cluster_link,
          region: region,
          response: theJson,
        }
      })
      .catch(reason => {
        return {
          cat_name: cat_name,
          state: "ERROR",
          cluster_link: cluster_link,
          region: region,
          reason: reason,
        }
      })
  }
  
  export async function getStatus(esConfig: EsConfig | undefined, res) {
    const promises: Promise<any>[] | undefined = esConfig?.cluster_links?.flatMap(cluster_link => {
      if (esConfig?.regions) {
        return esConfig?.regions?.flatMap(region => {
          const url = cluster_link.replace("{region}", region);
          return [
            getEsCat("health", url, region), 
            getEsCat("indices", url, region), 
            getEsCat("aliases", url, region), 
          ];
        });
      } else {
        return [
          getEsCat("health", cluster_link, "details"),
          getEsCat("indices", cluster_link, "details"),
          getEsCat("aliases", cluster_link, "details"),
        ];
      }
    });
  
    if (promises) {
      const successful = (await Promise.all(promises)).flatMap(res => {
        if (res["state"] === "ERROR") {
          return [];
        }
        return [res];
      });
      // console.log("successful", successful);
  
      const clusterStatus: any = {};
      successful.forEach(response => {
        // console.log("response", response);
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