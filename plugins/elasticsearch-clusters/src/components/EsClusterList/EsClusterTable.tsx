import React, { useEffect, useState } from 'react';
import {
    Table,
    TableColumn,
} from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Link, Progress } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import CerebroLogo_green from './../../assets/CerebroLogo-green.png';
import CerebroLogo_yello from './../../assets/CerebroLogo-yellow.png';
import CerebroLogo_red from './../../assets/CerebroLogo-red.png';
import KibanaLogo from './../../assets/KibanaLogo.svg';
import { fmtBytes, fmtNum, formatNumber } from '../utils';

const useStyles = makeStyles({
    pre: {
        fontFamily: "courier",
        color: "#229922",
    },
    icon: {
        height: "2em",
        width: "2em",
        filter: "brightness(75%)",
        borderRadius: "0.4em",
        // border: "1px solid black",
        boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
        marginRight: "0.5em",
        padding: "0.3em",
        borderTop: "1px solid #CCCCCC",
        borderRight: "1px solid #333333",
        borderBottom: "1px solid #333333",
        borderLeft: "1px solid #CCCCCC",
        textDecoration: "none",
        // backgroundColor: "#eee",
    },
    green: {
        // color: "white",
        // background: "green",
        border: "2px solid green",
        borderRadius: "0.4em",
        boxShadow: "1px 1px 12px rgba(0, 0, 0, 0.7)",
    },
    yellow: {
        // color: "black",
        // background: "yellow",
        border: "2px solid yellow",
        borderRadius: "0.4em",
        boxShadow: "1px 1px 12px rgba(0, 0, 0, 0.7)",
    },
    red: {
        // color: "black",
        // background: "red",
        border: "2px solid red",
        borderRadius: "0.4em",
        boxShadow: "1px 1px 12px rgba(0, 0, 0, 0.7)",
    },
    report: {
        fontSize: "1em",
    },
    reportDocCount: {
        paddingBottom: "2.5em",
    },
    reportSpanSpace: {
        fontSize: "18px",
    },
    reportTh: {
        paddingRight: "1.5em",
    },
    reportTh1: {
        borderBottom: "1px solid #eee",
    }
});

function getColumns(clusterStatus: any): TableColumn[] {
    const columns: TableColumn[] = [
        { title: 'Name', field: 'name', width: "10em" },
        { title: 'Aliases', field: 'aliases', width: "10em" },
    ];
    const regions: string[] = clusterStatus["regions"];
    if (regions) {
        regions.map(region => {
            const column_name = `details_${region}`
            columns.push({
                title: `Region: ${region}`,
                field: column_name,
                width: "16em",
            });
        })
    } else {
        columns.push({
            title: "details",
            field: "details",
        });
    }

    return columns;
}

function getStatusClassName(status: string) {
    const classes = useStyles();
    switch (status) {
        case "green":
            return classes.green;
        case "yellow":
            return classes.yellow;
    }
    return classes.red;
}
function getCerebroLogo(status: string) {
    switch (status) {
        case "green":
            return CerebroLogo_green;
        case "yellow":
            return CerebroLogo_yello;
    }
    return CerebroLogo_red;
}

function generateReport(classes, clusterRoot:any, region:string) {
    const cluster = clusterRoot[region];

    const docCountTitle = "Number of documents\n" + cluster.docCount;
    const docCount = fmtNum(cluster.docCount, 2);

    const storeTitle = "Total/Primary storage\n" + cluster.totalStorage + "/" + cluster.primaryStorage;
    const totalStorage = fmtBytes(cluster.totalStorage, 2);
    const primaryStorage = fmtBytes(cluster.primaryStorage, 2);

    return (<span
        key={crypto.randomUUID()}
        className={classes.report}
    >
        <span className={classes.reportDocCount} title={docCountTitle}>{docCount}</span>
        <br />
        <span className={classes.reportSpanSpace}> </span>
        <span title={storeTitle}>{totalStorage}/{primaryStorage}</span>
    </span>)
}

function renderCell(classes, cluster: any, region: string) {
    const regionDetails = cluster[region];
    const status = regionDetails?.status;
    const status_class = getStatusClassName(status);
    const cerebro_url = regionDetails?.cerebro

    const cerebro_logo = getCerebroLogo(status);

    var cerebro_link = (<span key={crypto.randomUUID()}></span>);
    if (cerebro_url && cerebro_url.length > 0) {
        cerebro_link =
            (<Link 
                key={crypto.randomUUID()}
                target="_blank" to={cerebro_url} title={cerebro_url}>
                <img
                    key={crypto.randomUUID()}
                    src={cerebro_logo}
                    className={classes.icon}
                    alt={status} />
            </Link>);
    }

    const kibana_url = regionDetails?.kibana
    var kibana_link = (<span key={crypto.randomUUID()}></span>);
    if (kibana_url && kibana_url.length > 0) {
        kibana_link = (
            <Link key={crypto.randomUUID()}
                target="_blank" to={kibana_url} title={kibana_url}>
                <img
                    key={crypto.randomUUID()}
                    src={KibanaLogo}
                    className={classes.icon}
                    alt="Kibana" />
            </Link>);
    }
    const cluster_report = generateReport(classes, cluster, region)
    return (<div
        title={"status: " + status}
        className={status_class}
        key={crypto.randomUUID()}>
        <table>
            <tbody>
                <tr>
                    <td>
                        {cerebro_link}
                        {kibana_link}
                    </td>
                    <td>
                        {cluster_report}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>);
}

function getData(clusterStatus: any): any[] {
    const classes = useStyles();
    const data: any[] = [];

    const regions = clusterStatus.regions;
    console.log("regions", regions)

    for (const [clusterName, cluster] of Object.entries<any>(clusterStatus.clusterStatus)) {
        const aliases: string[] = cluster.aliases;
        const result = {
            id: clusterName,
            key: clusterName,
            name: clusterName,
            // FIXME: fix warning (code works but warns)
            aliases: aliases.toString().replaceAll(",", ", "),
        };
        regions.forEach(region => {
            if(region in cluster) {
                result[`details_${region}`] = renderCell(classes, cluster, region);
            } else {
                result[`details_${region}`] = <span>-</span>;
            }
        })

        data.push(result);
    }

    return data;
}

const EsClusterStatusTable = ({clusterStatus}) => {
    const data: any[] = getData(clusterStatus);
    const columns: TableColumn[] = getColumns(clusterStatus);

    return (<Table
        key={crypto.randomUUID()}
        title="Elasticsearch Clusters"
        options={{
            search: false,
            paging: false,
            columnResizable: true,
            padding: 'dense',
            tableLayout: 'fixed'
        }}
        columns={columns}
        data={data}
    />)
}


export const EsClusterTable = () => {
    const classes = useStyles();
    const [clusterStatus, setClusterStatus] = useState(null)
    const config = useApi(configApiRef)
    const backendUrl = config.getString('backend.baseUrl');

    useEffect(() => {
        console.log("before fetch")
        fetch(`${backendUrl}/api/elasticsearch-clusters/v2/status`)
            .then((result) => result.json())
            .then((data) => {
                setClusterStatus(data)
            })
    }, [])
    if (clusterStatus == null) {
        return (<div><Progress/></div>)
    }
    if (clusterStatus && clusterStatus["status"] === "ok") {
        return (<EsClusterStatusTable clusterStatus={clusterStatus}/>)
    } else {
        return (<span>No <span className={classes.pre}>elasticsearch-clusters</span>
            &nbsp;config found in <span className={classes.pre}>/app-config.yaml</span><br />
            Please update your <span className={classes.pre}>app-config.yaml</span><br />
            <br />
            More details on how to configure this plugin can be found at&nbsp;
            <Link to="https://github.com/pehrs/backstage-elasticsearch-plugin/README.md">https://github.com/pehrs/backstage-elasticsearch-plugin/README.md</Link>
        </span>)
    }

};