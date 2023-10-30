import React from 'react';
import {
    Table,
    TableColumn,
} from '@backstage/core-components';
import { Link, TableCell, TableRow, makeStyles } from '@material-ui/core';
import CerebroLogo_green from './../../assets/CerebroLogo-green.png';
import CerebroLogo_yello from './../../assets/CerebroLogo-yellow.png';
import CerebroLogo_red from './../../assets/CerebroLogo-red.png';
import KibanaLogo from './../../assets/KibanaLogo.svg';


const useStyles = makeStyles({
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

type EsClusterTableProps = {
    clusterInfo: any;
};

interface LooseObject {
    [key: string]: any
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

function fmtNum(num: number, digits: number): string {
    var units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
        decimal;

    for (var i = units.length - 1; i >= 0; i--) {
        decimal = Math.pow(1000, i + 1);

        if (num <= -decimal || num >= decimal) {
            return +(num / decimal).toFixed(digits) + units[i];
        }
    }
    return "" + num
}

function esSizeStrToInt(es: string) {

    var clean = es.replace("b", "");
    var multiplier = 1.0;
    if (clean.endsWith("k")) {
        multiplier = 1000.0;
        clean = clean.replace("k", "");
    }
    if (clean.endsWith("m")) {
        multiplier = 1000000.0;
        clean = clean.replace("m", "");
    }
    if (clean.endsWith("g")) {
        multiplier = 1000000000.0;
        clean = clean.replace("g", "");
    }

    const base = parseFloat(clean);

    return base * multiplier;
}

class EsClusterReport {
    docsCount: number = 0;
    storeSize: number = 0.0;
    primaryStoreSize: number = 0.0;
    //   "node.total": "6",
    numberOfNodes: number = 0;
    //   "node.data": "3",
    numberOfDataNodes: number = 0;
    //   "shards": "31",
    activeShards: number = 0;
    //   "pri": "15",
    activePrimaryShards: number = 0;
    //   "relo": "0",
    relocatingShards: number = 0;
    //   "init": "0",
    initializingShards: number = 0;
    //   "unassign": "0",
    unassignedShards: number = 0;
    //   "pending_tasks": "0",
    numberOfPendingTasks: number = 0;
    //   "max_task_wait_time": "-",
    //   "active_shards_percent": "100.0%"
    activeShardsPercent: string = "";

    docsCountStr(): string {
        return fmtNum(this.docsCount, 1);
    }

    storeSizeStr(): string {
        return fmtNum(this.storeSize, 1);
    }

    primaryStoreSizeStr(): string {
        return fmtNum(this.primaryStoreSize, 1);
    }
};

function getClusterReport(es_endpoint: string, clusterInfo: any): EsClusterReport {

    const clusterStatus = clusterInfo.clusterStatus;

    const report: EsClusterReport = new EsClusterReport();

    // var docsCount = 0;
    // var storeSize = 0.0;
    // var primaryStoreSize = 0.0;
    for (const clusterKey in clusterStatus) {
        const cs = clusterStatus[clusterKey];
        for (const region in cs) {
            if (es_endpoint == clusterKey) {
                const regionData = cs[region];
                const regionIndices: any[] = regionData.indices.response;
                regionIndices.forEach(index => {
                    report.docsCount = report.docsCount + parseInt(index["docs.count"]);
                    report.storeSize = report.storeSize + esSizeStrToInt(index["store.size"])
                    report.primaryStoreSize = report.primaryStoreSize + esSizeStrToInt(index["pri.store.size"])
                });

                const regionHealth: any[] = regionData.health.response[0];
                report.numberOfNodes = parseInt(regionHealth["node.total"])
                report.numberOfDataNodes = parseInt(regionHealth["node.data"])
                report.activeShards = parseInt(regionHealth["shards"])
                report.activePrimaryShards = parseInt(regionHealth["pri"])
                report.relocatingShards = parseInt(regionHealth["relo"])
                report.initializingShards = parseInt(regionHealth["init"]);
                report.unassignedShards = parseInt(regionHealth["unassign"]);
                report.numberOfPendingTasks = parseInt(regionHealth["pending_tasks"]);
                report.activeShardsPercent = regionHealth["active_shards_percent"];
            }
        }
    }

    // console.log(es_endpoint, ":", report)
    return report;
}

function renderEsClusterReport(report: EsClusterReport, verbose: boolean): any {
    const classes = useStyles();

    const docCountTitle = `doc-count (${report.docsCount})`
    const storeTitle = `total/primary store size (${report.storeSize}/${report.primaryStoreSize})`
    if (verbose) {


        return (
            <table>
                <tr>
                    <th className={classes.reportTh1}>Documents</th>
                    <th className={classes.reportTh1} colSpan={2}>Storage</th>
                    <th className={classes.reportTh1} colSpan={2}>Shards</th>
                </tr>
                <tr>
                    <th className={classes.reportTh} >Count</th>

                    <th className={classes.reportTh} >Total</th>
                    <th className={classes.reportTh} >Primary </th>

                    <th className={classes.reportTh} >Active</th>
                    <th className={classes.reportTh} >Primary</th>
                    <th className={classes.reportTh} >Relocating</th>
                    <th className={classes.reportTh} >Initializing</th>
                    <th className={classes.reportTh} >Unassigned</th>
                </tr>
                <tr>

                    <td>{report.docsCountStr()}</td>

                    <td>{report.storeSizeStr()}</td>
                    <td>{report.primaryStoreSizeStr()}</td>

                    <td>{report.activeShards} ({report.activeShardsPercent})</td>
                    <td>{report.activePrimaryShards}</td>
                    <td>{report.relocatingShards}</td>
                    <td>{report.relocatingShards}</td>
                    <td>{report.initializingShards}</td>
                    <td>{report.unassignedShards}</td>

                </tr>
            </table>
        )

    } else {
        return (<span
            key={crypto.randomUUID()}
            className={classes.report}
        >
            <span className={classes.reportDocCount} title={docCountTitle}>{report.docsCountStr()}</span>
            <br />
            <span className={classes.reportSpanSpace}> </span>
            <span title={storeTitle}>{report.storeSizeStr()}/{report.primaryStoreSizeStr()}</span>
        </span>)
    }
}


function getColumnsAndData(clusterInfo: any): [TableColumn[], any[]] {
    const classes = useStyles();

    const esConfig: any = clusterInfo["esConfig"];
    const clusterStatus: any = clusterInfo["clusterStatus"];

    const cluster_links = esConfig["cluster_links"];
    const cerebro_link_template = esConfig["cerebro_link"]
    const kibana_link_template = esConfig["kibana_link"]

    const data: any[] = [];

    const columns: TableColumn[] = [
        { title: 'Name', field: 'name', width: "10em" },
        { title: 'Aliases', field: 'aliases', width: "10em" },
    ];
    const regions: string[] = esConfig["regions"];
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

    for (const i in cluster_links) {
        const cluster_link = cluster_links[i];

        const cluster_name = getclusterName(cluster_link, clusterInfo);
        const aliases = getAliasNames(cluster_link, clusterInfo)
            .toString().replace(",", ", ")
            .replace("-\n", "-");

        const row_id = `${crypto.randomUUID()}`;
        let row_data: LooseObject = {
            id: row_id,
            key: row_id,
            name: (<span>{cluster_name}</span>),
            aliases: `${aliases}`,
        }

        if (regions) {
            regions.forEach(region => {
                const column_name = `details_${region}`
                const es_url = cluster_link.replace("{region}", region);
                const es_hostname = new URL(es_url).hostname;
                var kibana_url = undefined;
                if (kibana_link_template) {
                    kibana_url = kibana_link_template.replace("{cluster_host}", es_hostname).replace("{region}", region);
                }
                if (es_url in clusterStatus && region in clusterStatus[es_url]) {
                    const regionStatus = clusterStatus[es_url][region];
                    var cerebro_url = undefined;
                    if (cerebro_link_template && cerebro_link_template.length > 0) {
                        cerebro_url = cerebro_link_template.replace("{cluster_link}", cluster_link).replace("{region}", region)
                    }

                    row_data[column_name] = renderCell(es_url, cerebro_url, kibana_url, regionStatus, clusterInfo, false);
                } else {
                    row_data[column_name] = (<div key={crypto.randomUUID()}>-</div>)
                }
            })
        } else {
            const es_url = cluster_link;
            const es_hostname = new URL(es_url).hostname;
            var kibana_url = undefined;
            if (kibana_link_template) {
                kibana_url = kibana_link_template.replace("{cluster_host}", es_hostname);
            }

            if (es_url in clusterStatus && "details" in clusterStatus[es_url]) {
                const regionStatus = clusterStatus[es_url]["details"];
                var cerebro_url = undefined;
                if (cerebro_link_template && cerebro_link_template.length > 0) {
                    cerebro_url = cerebro_link_template.replace("{cluster_link}", cluster_link)
                }
                row_data["details"] = renderCell(es_url, cerebro_url, kibana_url, regionStatus, clusterInfo, true);
            } else {
                row_data["details"] = (<div key={crypto.randomUUID()}>-</div>)
            }
        }
        data.push(row_data)
    }

    return [columns, data];
}


function renderCell(
    es_url: any,
    cerebro_url: any | undefined,
    kibana_url: any | undefined,
    regionStatus: any,
    clusterInfo: any,
    verbose: boolean,
): any {
    const classes = useStyles();

    var kibana_link = (<span key={crypto.randomUUID()}></span>);
    if (kibana_url && kibana_url.length > 0) {
        kibana_link = (
            <Link key={crypto.randomUUID()}
                target="_blank" href={kibana_url} title={kibana_url}>
                <img
                    key={crypto.randomUUID()}
                    src={KibanaLogo}
                    className={classes.icon}
                    alt="Kibana" />
            </Link>);
    }

    const status = regionStatus.health.response[0].status;

    const cerebro_logo = getCerebroLogo(status);
    const status_class = getStatusClassName(status);

    const cluster_report_data = getClusterReport(es_url, clusterInfo);
    const cluster_report = renderEsClusterReport(cluster_report_data, verbose);

    var cerebro_link = (<span key={crypto.randomUUID()}></span>);
    if (cerebro_url && cerebro_url.length > 0) {
        cerebro_link =
            (<Link key={crypto.randomUUID()}
                target="_blank" href={cerebro_url} title={cerebro_url}>
                <img
                    key={crypto.randomUUID()}
                    src={cerebro_logo}
                    className={classes.icon}
                    alt={status} />
            </Link>);
    }
    //  style={{border: "1px solid red"}}
    return (<div
        title={"status: " + status}
        className={status_class}
        key={crypto.randomUUID()}>
        <table>
            <tr>
                <td>
                    {cerebro_link}
                    {kibana_link}
                </td>
                <td>
                    {cluster_report}
                </td>
            </tr>
        </table>
    </div>);
}

export const EsClusterTable = ({ clusterInfo }: EsClusterTableProps) => {
    const [columns, data] = getColumnsAndData(clusterInfo);
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
