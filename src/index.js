var AdmZip = require('adm-zip');
var buffer = require("buffer");
import Chart from 'chart.js/auto';

const hashAbbreviationLength = 8;
const PIPELINE_ID = 2029;
const ARTIFACT_NAME = "npt-stats";
const MAX_DOWNLOADS = 100;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

VSS.init({
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

VSS.require([
   "VSS/Authentication/Services",
   "TFS/Dashboards/WidgetHelpers"
   ],
   function (VSS_Auth_Service, WidgetHelpers) {
        WidgetHelpers.IncludeWidgetStyles();

        VSS.getAccessToken().then(function(token) {
            let authHeader = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(token);
            let chartData = [];

            downloadPipelineArtifacts(authHeader, chartData, () => {
                let chartValues = [];
                let chartLabels = [];
                let chart = null;

                function filterData(settings) {
                    chartValues = [];
                    chartLabels = [];
                    let dataSlice = chartData.slice(Math.max(chartData.length - settings.n, 0));
                    dataSlice.forEach((dataEntry) => {
                        chartValues.push(parseFloat(dataEntry[settings.measure][settings.pivot][settings.metricType][settings.metric]));
                        chartLabels.push(dataEntry["commit"].substring(0, hashAbbreviationLength));
                    });
                }

                function createChart(widgetSettings) {
                    if (chart != null) {
                        chart.destroy();
                        chart = null;
                    }

                    let settings = JSON.parse(widgetSettings.customSettings.data);
                    if (settings == null) {
                        settings = {
                            "measure": "throughput",
                            "pivot": "64-sessions",
                            "metricType": "stats",
                            "metric": "mean",
                            "unit": "Gbps",
                            "color": "#ff007b",
                            "n": 5
                        };
                    }

                    filterData(settings);

                    let color = hexToRgb(settings.color);
                    let colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`

                    const data = {
                        labels: chartLabels,
                        datasets: [{
                            label: settings.measure,
                            backgroundColor: colorStr,
                            borderColor: colorStr,
                            data: chartValues
                        }]
                    };

                    const config = {
                        type: 'line',
                        data: data,
                        options: {
                            onClick: (event, elements, chart ) => {
                                console.log(elements[0].index);
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        footer: (context) => {
                                            let startIndex = Math.max(chartData.length - settings.n, 0);

                                            let dataEntry = chartData[startIndex + context[0].dataIndex];
                                            let date = new Date(dataEntry.date);
                                            let month = date.getMonth() + 1;
                                            let day = date.getDate();
                                            let year = date.getFullYear();
                                            return `${month}/${day}/${year}`;
                                        }
                                    }
                                }
                            },
                            interaction: {
                                intersect: false,
                                mode: 'index'
                            },
                            scales: {
                                yAxis: {
                                    title: {
                                        text: `${capitalizeFirstLetter(settings.measure)} (${settings.unit})`,
                                        display: true
                                    }
                                },
                                xAxis: {
                                    ticks: {
                                        display: false
                                    }
                                }
                            }
                        }
                    };

                    chart = new Chart(
                        $('#perf-chart'),
                        config
                    );

                    let $title = $("#chart-title");
                    let metricText = settings.metric;
                    if (settings.metricType == "percentiles") {
                        metricText = `p${metricText}`;
                    }
                    $title.text(`${capitalizeFirstLetter(settings.measure)} - ${settings.pivot.replace('-', ' ')} - ${metricText}`);
                }

                VSS.register("VswitchPerformanceViewer", function () {
                    return {
                        load:function(widgetSettings) {
                            createChart(widgetSettings);
                            return WidgetHelpers.WidgetStatusHelper.Success();
                        },
                        reload:function(widgetSettings) {
                            createChart(widgetSettings);
                            return WidgetHelpers.WidgetStatusHelper.Success();
                        }
                    }
                });
                   VSS.notifyLoadSucceeded();
            });
       });
});

function downloadPipelineArtifacts(authHeader, chartData, displayContentCallback) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        let response = JSON.parse(this.responseText);
        let initializedAllDownloads = false;
        let numLoading = 0;
        function downloadArtifactCallback() {
            numLoading -= 1;
            if (initializedAllDownloads && numLoading == 0) {
                chartData.sort((a, b) => {
                    if (a.date < b.date) return -1;
                    if (a.date > b.date) return 1;
                    return 0;
                });
                displayContentCallback();
            }
        }

        response.value.sort((a, b) => {
            let dateA = new Date(a.createdDate);
            let dateB = new Date(b.createdDate);
            if (dateA < dateB) {
                return 1;
            }
            else if (dateA > dateB) {
                return -1;
            }
            return 0;
        });

        let numPipelineRuns = 0;
        response.value.forEach((currentValue) => {
            if ((currentValue.result == 'succeeded') && (numPipelineRuns < MAX_DOWNLOADS)) {
                numLoading++;
                numPipelineRuns++;
                downloadPipelineArtifact(currentValue.id, authHeader, chartData, currentValue.createdDate, downloadArtifactCallback);
            }
        });
        initializedAllDownloads = true;
    };
    xhttp.open('GET', `https://dev.azure.com/mscodehub/WindowsDpdk/_apis/pipelines/${PIPELINE_ID}/runs?api-version=6.0-preview.1`);
    xhttp.setRequestHeader('Authorization', authHeader);
    xhttp.send();
}

function downloadPipelineArtifact(runId, authHeader, chartData, date, downloadCallback) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        let response = JSON.parse(this.responseText);
        downloadFromSignedURL(response.signedContent.url, chartData, date, downloadCallback);
    };
    xhttp.open("GET", `https://dev.azure.com/mscodehub/WindowsDpdk/_apis/pipelines/${PIPELINE_ID}/runs/${runId}/artifacts?artifactName=${ARTIFACT_NAME}&$expand=signedContent&api-version=6.0-preview.1`);
    xhttp.setRequestHeader('Authorization', authHeader);
    xhttp.send();
}

function downloadFromSignedURL(url, chartData, date, downloadCallback) {
    fetch(url)
    .then((response) => {
        return response.arrayBuffer();
    })
    .then((dataBuffer) => {
        let zip = new AdmZip(new Buffer(dataBuffer));
        let zipEntries = zip.getEntries();
        let artifactData = {};
        zipEntries.forEach((zipEntry) => {
            if (zipEntry.entryName == "npt-stats/ctstraffic.json") {
                let data = JSON.parse(zipEntry.getData().toString('utf16le').trim());
                artifactData["throughput"] = data["throughput"];
            }
            else if (zipEntry.entryName == "npt-stats/latte.json") {
                let data = JSON.parse(zipEntry.getData().toString('utf16le').trim());
                artifactData["latency"] = data["latency"];
            }
            else if (zipEntry.entryName == "npt-stats/meta.json") {
                let data = JSON.parse(zipEntry.getData().toString('utf16le').trim());
                artifactData["commit"] = data["commit"];
            }
        });
        artifactData["date"] = Date.parse(date);
        chartData.push(artifactData);
        downloadCallback();
    });
}