/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Progress,
  ResponseErrorPanel,
  Table,
  TableColumn,
  // Progress, 
  // ResponseErrorPanel,
} from '@backstage/core-components';
// import useAsync from 'react-use/lib/useAsync';
// import { config } from 'process';
import { EsConfig, getEsConfig } from './config';
import { Link } from '@material-ui/core';
import CerebroLogo from './../../assets/CerebroLogo.png';
import KibanaLogo from './../../assets/KibanaLogo.svg';
// import { getClusterInfos } from './api';
// import { useAsync, useStateWithHistory } from 'react-use';
// import { useApi, configApiRef } from '@backstage/core-plugin-api';

const useStyles = makeStyles({
  cerebro_green: {
    height: 24,
    width: 24,
    borderRadius: '50%',
    filter: "opacity(0.5) drop-shadow(0 0 0 green)",
  },
  cerebro_yellow: {
    height: 24,
    width: 24,
    borderRadius: '50%',
    filter: "opacity(0.5) drop-shadow(0 0 0 yellow)",
  },
  cerebro_red: {
    height: 24,
    width: 24,
    borderRadius: '50%',
    filter: "opacity(0.5) drop-shadow(0 0 0 red)",
  },
  kibana: {
    height: 24,
    width: 24,
    borderRadius: '50%',
    marginLeft: "0.5em",
  },
});

const classes = useStyles();


type DenseTableProps = {
  clusterInfo: any;
};

function getCerebroClass(status: string) {
  // switch (status) {
  //   case "green":
  //     return classes.cerebro_green;
  //   case "yellow":
  //     return classes.cerebro_yellow;
  //   case "red":
  //     return classes.cerebro_red;
  // }
  return classes.cerebro_green;
}

function getclusterName(cluster_link: string, clusterInfo: any): string {
  const clusterStatus = clusterInfo.clusterStatus;
  for (const clusterKey in clusterStatus) {
    const cs = clusterStatus[clusterKey];
    for (const region in cs) {
      const es_endpoint = cluster_link.replace("{region}", region);
      if (es_endpoint == clusterKey) {
        return cs[region].health.response[0].cluster;
      }
    }
  }
  return "n/a"
}

  function getAliasNames(cluster_link: string, clusterInfo: any): string[] {

    const clusterStatus = clusterInfo.clusterStatus;
    let aliases = new Set<string>();

    for (const clusterKey in clusterStatus) {
      const cs = clusterStatus[clusterKey];
      for (const region in cs) {
        const es_endpoint = cluster_link.replace("{region}", region);
        if (es_endpoint == clusterKey) {
          const regionData = cs[region];
          const regionAliases: any[] = regionData.aliases.response;
          regionAliases.forEach(alias => {
            if (!alias.alias.startsWith(".")) {
              aliases.add(alias.alias);
            }
          });
        }
      }
    }
    // return aliases.filter(alias => !alias.alias.startsWith("."))

    return Array.from(aliases);
  }

export const DenseTable = ({ clusterInfo }: DenseTableProps) => {

  var data: any = [];

  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Aliases', field: 'aliases' },
  ];

  const esConfig: EsConfig = clusterInfo.esConfig;

  const clusterStatus = clusterInfo.clusterStatus;
  console.log("clusterStatus", clusterStatus)

  if (esConfig && esConfig.cluster_links) {
    if (esConfig.regions?.length == 0) {
      columns.push({
        title: "Details",
        field: "details",
      })
    } else {
      esConfig.regions?.map(region => {
        columns.push({
          title: region,
          field: `${region}_link`
        });
      })
    }


    data = esConfig.cluster_links?.map(cluster_link => {

      const cluster_name = getclusterName(cluster_link, clusterInfo)
      const aliases = getAliasNames(cluster_link, clusterInfo)
      // console.log("aliases", aliases)

      const response: any = {
        key: `${cluster_name}`,
        name: `${cluster_name}`,
        aliases: `${aliases}`
      };
      if (esConfig.regions?.length == 0) {
        const link = esConfig.cerebro_link?.replace("{cluster_link}", cluster_link)
        const cerebro_class = classes.cerebro_green;
        response["details"] = (
          <Link key={crypto.randomUUID()} target="_blank" href={link}>
            <img
              key={crypto.randomUUID()}
              src={CerebroLogo}
              className={cerebro_class}
              alt="cerebro"
            />
          </Link>
        )
      } else {

        esConfig.regions?.map(region => {
          const link = esConfig.cerebro_link?.replace("{cluster_link}", cluster_link).replace("{region}", region)

          const es_endpoint = cluster_link.replace("{region}", region);
          const es_url = new URL(es_endpoint);


          var kibana_link = (<span key={crypto.randomUUID()}></span>)
          if (esConfig.kibana_link && esConfig.kibana_link.length > 0) {
            const kibana_url = esConfig.kibana_link?.replace("{cluster_host}", es_url.hostname).replace("{region}", region);
            kibana_link = (
              <Link key={crypto.randomUUID()} target="_blank" href={kibana_url} title="Kibana">
                <img
                  key={crypto.randomUUID()}
                  src={KibanaLogo}
                  className={classes.kibana}
                  alt="Kibana"
                />
              </Link>)
          }

          // console.log("es_url", es_url);
          // console.log("kibana_link", kibana_link);

          // console.log("cluster_link", es_endpoint, cluster_link in clusterStatus)
          // console.log("region", region)
          if (es_endpoint in clusterStatus && region in clusterStatus[es_endpoint]) {
            const regionStatus = clusterStatus[es_endpoint][region];

            const status = regionStatus.health.response[0].status;
            const cerebro_class = classes.cerebro_green; // getCerebroClass(status);

            var cerebro_link = (<span key={crypto.randomUUID()}></span>)
            if (esConfig.cerebro_link?.length > 0) {
              cerebro_link =
                (<Link key={crypto.randomUUID()} target="_blank" href={link} title="Cerebro">
                  <img
                    key={crypto.randomUUID()}
                    src={CerebroLogo}
                    className={cerebro_class}
                    alt="Cerebro"
                  />
                </Link>);
            }

            response[`${region}_link`] = (
              <div key={crypto.randomUUID()}>
                {cerebro_link}
                {kibana_link}
                {status}
              </div>
            )
          } else {
            response[`${region}_link`] = (
              <div key={crypto.randomUUID()}>
                n/a
              </div>
            )
          }
        })
      }
      return response;
    });
  }

  return (
    <Table
      key={crypto.randomUUID()}
      title="Elasticsearch Clusters"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );

};


export const ExampleFetchComponent = () => {

  // const [clusterInfo, setClusterInfo] = useState(null)
  // const [isLoading, setLoading] = useState(true)

  // const config = useApi(configApiRef)
  // const backendUrl = config.getString('backend.baseUrl');

  // useEffect(() => {
  //   console.log("before fetch")
  //   //fetch('http://localhost:7007/api/elasticsearch-clusters/status')
  //   // .then((result) => result.json())
  //   // getClusterInfos()
  //   fetch(`${backendUrl}/api/elasticsearch-clusters/status`)
  //     .then((result) => result.json())
  //     .then((data) => {
  //       console.log("data", data);
  //       setClusterInfo(data)
  //       // setLoading(false)
  //     })
  // }, [])

  // return clusterInfo == null ? (
  //   <Progress key={crypto.randomUUID()} />
  // ) : (
  //   <DenseTable key={crypto.randomUUID()} clusterInfo={clusterInfo} />
  // )
  // return (<Progress key={crypto.randomUUID()} />)

  return (<div>HELLO</div>)
};



export const ExampleFetchComponent2 = () => {
  return (<div key={crypto.randomUUID()}>HELLO</div>)
}
