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
                let formattedData = {
                    labels: [],
                    datasets: []
                }; 
                let chart = null;

                function filterData(settings) {
                    console.log("CHECKPOINT A");
                    formattedData.labels = [];
                    formattedData.datasets = [];

                    let dataSlice = chartData.slice(Math.max(chartData.length - settings.n, 0));
                    console.log("CHECKPOINT B");
                    console.log(`settings: ${JSON.stringify(settings)}`);

                    for (let i = 0; i < settings.numSeries; i++) {
                        let color = hexToRgb(settings.seriesSettings[i].color); 
                        formattedData.datasets.push({
                            data: [],
                            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                            borderColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                            label: "hello"
                        });
                        console.log(`CHECKPOINT C ${i}`);
                        dataSlice.forEach((dataEntry) => {
                            if (i == 0) {
                                formattedData.labels.push(dataEntry["commit"].substring(0, hashAbbreviationLength));
                            }
                            formattedData.datasets[i].data.push(
                                parseFloat(dataEntry[settings.measure][settings.seriesSettings[i].pivot][settings.seriesSettings[i].metricType][settings.seriesSettings[i].metric])
                            );
                        });
                        console.log(`CHECKPOINT D ${i}`);
                    }

                    console.log(JSON.stringify(formattedData));
                }

                function createChart(widgetSettings) {
                    if (chart != null) {
                        chart.destroy();
                        chart = null;
                    }
                    console.log("CHECKPOINT 1");
                    let settings = JSON.parse(widgetSettings.customSettings.data);
                    console.log("CHECKPOINT 2");
                    if (settings == null) {
                        settings = {
                            "measure": "throughput",
                            "unit": "Gbps",
                            "n": 5,
                            "numSeries": 1,
                            "seriesSettings": [{
                                "pivot": "64-sessions",
                                "metricType": "stats",
                                "metric": "mean",
                                "color": "#ff007b",
                            }]
                        };
                    }

                    console.log("CHECKPOINT 3");
                    filterData(settings);
                    console.log("CHECKPOINT 4"); 

                    const data = {
                        labels: formattedData.labels,
                        datasets: [formattedData.datasets[0]]
                    };
                    
                    console.log(settings);

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
                    let metricText = settings.seriesSettings[0].metric;
                    if (settings.seriesSettings[0].metricType == "percentiles") {
                        metricText = `p${metricText}`;
                    }
                    $title.text(`${capitalizeFirstLetter(settings.measure)} - ${settings.seriesSettings[0].pivot.replace('-', ' ')} - ${metricText}`);
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