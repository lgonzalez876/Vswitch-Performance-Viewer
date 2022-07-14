const DEFAULT_NUM_DATAPOINTS = 5;
const DEFAULT_SERIES_COLOR = '#ff007b';
const WIDGET_HEIGHT = 800;

const numSeriesOptions = {
    options: ['1', '2', '3', '4', '5'],
    default: '1'
};

const measurementOptions = {
    options: ["throughput", "latency"],
    default: "throughput"
};

const metricTypeOptions = {
    options: ["stats", "percentiles"],
    default: "stats"
}

const metricOptions = {
    stats: {
        options: ["n", "sum", "range", "min", "mean", "max", "median", "mode",
                    "variance", "std dev", "std err", "kurtosis", "skewness"],
        default: "mean"
    },
    percentiles: {
        options: ["0", "1", "5", "10", "25", "30", "40", "50", "60", "70", "75", 
                    "80", "90", "95", "96", "97", "98", "99", "99.9", "99.99", "99.999"],
        default: "99"
    }
};

const pivotOptions = {
    latency: {
        pivotName: "protocol",
        options: ["TCP", "UDP"],
        default: "TCP"
    },
    throughput: {
        pivotName: "sessions",
        options: ["1", "64"],
        default: "64"
    }
}

const unitMappings = {
    throughput: "Gbps",
    latency: "us"
}

VSS.init({                        
    explicitNotifyLoaded: true,
    usePlatformStyles: true
});

// VSS require imports API functions as well as common libraries like jquery
VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) { 
    let seriesInputElements = [];

    // Populates a given dropdown with the a set of options and selected value
    function populateDropdown($dropdown, options, selected, valueCallback) {
        if (valueCallback == undefined) {
            valueCallback = (item) => {return item};
        }

        $dropdown.empty();
        options.forEach((item) => {
            if (item == selected) {
                $dropdown.append($('<option>', {
                    value: valueCallback(item),
                    text: item,
                    selected: true
                }));
            }
            else {
                $dropdown.append($('<option>', {
                    value: valueCallback(item),
                    text: item,
                }));
            }
        });
    }

    // Creates a new set of data series input elements 
    function addDataSeriesInputs(seriesIndex) {
        let $configContainer = $('#config-container');
        let $pivotDropdown = 
            $('<div/>', 
                {
                    'class': 'container'
                }
            ).append(
                $('<fieldset/>').append(
                    $('<div/>').append(
                        $('<label/>', 
                            {
                                'class': 'label',
                                'id': `pivot-label${seriesIndex}`
                            }
                        )
                    )
                ).append(
                    $('<select/>', 
                        {
                            'id':`pivot-dropdown${seriesIndex}`,
                            'style':'margin-top:10px'
                        }
                    )
                )
            );
        let $metricTypeDropdown = 
            $('<div/>', 
                {
                    'class': 'container'
                }
            ).append(
                $('<fieldset/>').append(
                    $('<div/>').append(
                        $('<label/>', 
                            {
                                'class': 'label',
                                'text':'Metric Type: '
                            }
                        )
                    )
                ).append(
                    $('<select/>', 
                        {
                            'id':`metric-type-dropdown${seriesIndex}`,
                            'style':'margin-top:10px'
                        }
                    )
                )
            );
        let $metricDropdown = 
            $('<div/>',
                {
                    'class': 'container'
                }
            ).append(
                $('<fieldset/>').append(
                    $('<div/>').append(
                        $('<label/>', 
                            {
                                'class': 'label',
                                'text':'Metric: '
                            }
                        )
                    )
                ).append(
                    $('<select/>', 
                        {
                            'id':`metric-dropdown${seriesIndex}`,
                            'style':'margin-top:10px'
                        }
                    )
                )
            );
        let $colorPicker = 
            $('<div/>', 
                {
                    'class': 'container'
                }
            ).append(
                $('<div/>').append(
                    $('<label/>',
                        {
                            'class':'label',
                            'text':'Series Color: '
                        }
                    )
                )
            ).append(
                $('<input/>', 
                    {
                        'type':'color',
                        'id':`color-picker${seriesIndex}`,
                        'name':'color-picker',
                        'value':'#ff007b'
                    }
                )
            );
        let $seriesContainer = 
            $('<div/>',
                {
                    'id':`series${seriesIndex}-options-container`
                }
            ).append(
                $('<h3/>', 
                    {
                        'text': `Series ${seriesIndex + 1} Options`
                    }
                )
            ).append(
                $pivotDropdown
            ).append(
                $metricTypeDropdown
            ).append(
                $metricDropdown
            ).append(
                $colorPicker
            );

        $configContainer.append($seriesContainer); 
        seriesInputElements.push($seriesContainer);
    }

    // Creates all input elements with saved settings preselected
    function initializeFromSavedSettings(
        curSettings,
        WidgetHelpers,
        widgetConfigurationContext
    ) {
        initializeGlobalInputs(
            WidgetHelpers,
            widgetConfigurationContext,
            curSettings.measure,
            curSettings.numSeries,
            curSettings.n
        );
        for (let i = 0; i < curSettings.seriesSettings.length; i++) {
            let series = curSettings.seriesSettings[i];
            initializeSeriesInputs(
                i,
                WidgetHelpers,
                widgetConfigurationContext,
                curSettings.measure,
                series.metricType,
                series.metric,
                series.pivot.split('-')[0],
                series.color
            );
        }
    }

    // Populates input elements for global options
    function initializeGlobalInputs(
        WidgetHelpers,
        widgetConfigurationContext,
        measurement,
        numSeries,
        numDatapoints
    ) {
        if (measurement == 'default' || measurement == undefined) {
            measurement = measurementOptions.default;
        }
        if (numSeries == 'default' || numSeries == undefined) {
            numSeries = numSeriesOptions.default;
        }
        if (numDatapoints == 'default' || numDatapoints == undefined) {
            numDatapoints = DEFAULT_NUM_DATAPOINTS;
        }

        let $measurementDropdown = $("#measurement-dropdown");
        populateDropdown(
            $measurementDropdown,
            measurementOptions.options,
            measurement
        );

        let $numSeriesDropdown = $('#num-series-dropdown');
        populateDropdown(
            $numSeriesDropdown,
            numSeriesOptions.options,
            numSeries
        ); 

        let $nRange = $('#n-range-input');
        let $nLabel = $('#n-label'); 
        $nLabel.text(numDatapoints);
        $nRange.val(numDatapoints);

        setGlobalInputsCallbacks(
            WidgetHelpers,
            widgetConfigurationContext
        );
    }

    // Creates the input elements for data series settings, 
    // populates them with the appropriate options, and sets callbacks
    // for when inputs change 
    function initializeSeriesInputs(
        seriesIdx,
        WidgetHelpers,
        widgetConfigurationContext,
        measurement,
        metricType,
        metric,
        pivot,
        color
    ) {
        addDataSeriesInputs(seriesIdx);

        let $metricTypeDropdown = $(`#metric-type-dropdown${seriesIdx}`);
        let $metricDropdown = $(`#metric-dropdown${seriesIdx}`);
        let $pivotDropdown = $(`#pivot-dropdown${seriesIdx}`);
        let $pivotLabel = $(`#pivot-label${seriesIdx}`); 
        let $colorPicker = $(`#color-picker${seriesIdx}`);

        if (measurement == 'default' || measurement == undefined) {
            measurement = measurementOptions.default;
        }
        if (metricType == 'default' || metricType == undefined) {
            metricType = metricTypeOptions.default;
        }
        if (metric == 'default' || metric == undefined) {
            metric = metricOptions[metricType].default;
        }
        if (pivot == 'default' || pivot == undefined) {
            pivot = pivotOptions[measurement].default;
        }
        if (color == 'default' || color == undefined) {
            color = DEFAULT_SERIES_COLOR;
        }

        populateDropdown(
            $metricTypeDropdown,
            metricTypeOptions.options,
            metricType
        );
        populateDropdown(
            $metricDropdown,
            metricOptions[metricType].options,
            metric
        );
        $pivotLabel.text(pivotOptions[measurement]["pivotName"]);
        populateDropdown(
            $pivotDropdown,
            pivotOptions[measurement].options,
            pivot,
            (item) => {
                return `${item}-${pivotOptions[measurement]["pivotName"]}`;
            }
        );
        $colorPicker.val(color);

        setElementCallback(
            $metricTypeDropdown,
            'change',
            WidgetHelpers,
            widgetConfigurationContext,
            () => {
                let metricType = $metricTypeDropdown.val();
                populateDropdown(
                    $metricDropdown,
                    metricOptions[metricType]["options"],
                    metricOptions[metricType]["default"]
                );
            }
        );
        setElementCallback(
            $metricDropdown,
            'change',
            WidgetHelpers,
            widgetConfigurationContext
        );
        setElementCallback(
            $pivotDropdown,
            'change',
            WidgetHelpers,
            widgetConfigurationContext
        ); 
        setElementCallback(
            $colorPicker,
            'change',
            WidgetHelpers,
            widgetConfigurationContext
        );
        setElementCallback(
            $colorPicker,
            'input',
            WidgetHelpers,
            widgetConfigurationContext
        );
    }
    
    // Extracts values from all input fields and packages them into a json string
    function packageDropdownValues() {
        let $measurementDropdown = $("#measurement-dropdown");
        let $numSeriesDropdown = $('#num-series-dropdown');
        let $nRange = $('#n-range-input');
        
        let numSeries = parseInt($numSeriesDropdown.val());
        let seriesSettings = [];
        for (let i = 0; i < numSeries; i++) {
            let $pivotDropdown = $(`#pivot-dropdown${i}`);
            let $metricTypeDropdown = $(`#metric-type-dropdown${i}`);
            let $metricDropdown = $(`#metric-dropdown${i}`);
            let $colorPicker = $(`#color-picker${i}`);

            seriesSettings.push({
                pivot: $pivotDropdown.val(),
                metricType: $metricTypeDropdown.val(),
                metric: $metricDropdown.val(),
                color: $colorPicker.val()
            });
        }
        return JSON.stringify({
                measure: $measurementDropdown.val(),
                unit: unitMappings[$measurementDropdown.val()],
                n: Math.round($nRange.val()),
                numSeries: numSeries,
                seriesSettings: seriesSettings
        });
    }

    // Configures an input element to (optionally) execute custom code, 
    // and then notifty the Performance Viewer widget when a value changes
    function setElementCallback(
        $element, 
        eventName, 
        WidgetHelpers, 
        widgetConfigurationContext, 
        customCallback
    ) {
        if (customCallback == undefined) {
            customCallback = () => {};
        }
        $element.on(eventName, () => {
            customCallback();
            let customSettings = {
                data: packageDropdownValues()
            };
            let eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
            let eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
            widgetConfigurationContext.notify(eventName, eventArgs);
        });
    }

    // Sets callbacks for global inputs
    function setGlobalInputsCallbacks(WidgetHelpers, widgetConfigurationContext) {
        let $numSeriesDropdown = $('#num-series-dropdown');
        let $measurementDropdown = $("#measurement-dropdown");

        setElementCallback(
            $numSeriesDropdown,
            'change',
            WidgetHelpers,
            widgetConfigurationContext,
            () => {
                let curNumSeries = parseInt($numSeriesDropdown.val());
                if (seriesInputElements.length < curNumSeries) {
                    while (seriesInputElements.length < curNumSeries) {
                        initializeSeriesInputs(
                            seriesInputElements.length,
                            WidgetHelpers,
                            widgetConfigurationContext,
                            $measurementDropdown.val()
                        );
                    }
                }
                else if (seriesInputElements.length > curNumSeries) {
                    while (seriesInputElements.length > curNumSeries) {
                        $seriesElement = seriesInputElements.pop();
                        $seriesElement.remove();
                    }
                }
            }
        );

        setElementCallback(
            $measurementDropdown,
            'change',
            WidgetHelpers,
            widgetConfigurationContext,
            () => {
                let $configContainer = $('#config-container');
                $configContainer.empty();
                seriesInputElements = [];
                $numSeriesDropdown.val("1");
                initializeSeriesInputs(
                    0,
                    WidgetHelpers,
                    widgetConfigurationContext,
                    $measurementDropdown.val()
                );
            }
        );

        let $nRange = $('#n-range-input');
        let $nLabel = $('#n-label');
        setElementCallback(
            $nRange,
            'change',
            WidgetHelpers,
            widgetConfigurationContext,
            () => {
                $nLabel.text(Math.round($nRange.val()));
            }
        );
        setElementCallback(
            $nRange,
            'input',
            WidgetHelpers,
            widgetConfigurationContext,
            () => {
                $nLabel.text(Math.round($nRange.val()));
            }
        );
    }

    VSS.register("VswitchPerformanceViewer.Configuration", function () {
        VSS.resize(300, WIDGET_HEIGHT);
        return {
            load: function (widgetSettings, widgetConfigurationContext) {
                let curSettings = JSON.parse(widgetSettings.customSettings.data);
                if (curSettings != null) {
                    initializeFromSavedSettings(
                        curSettings,
                        WidgetHelpers,
                        widgetConfigurationContext
                    );
                    
                }
                else {
                    initializeGlobalInputs(
                        WidgetHelpers,
                        widgetConfigurationContext
                    );
                    initializeSeriesInputs(
                        0,
                        WidgetHelpers,
                        widgetConfigurationContext
                    );
                }
                
                return WidgetHelpers.WidgetStatusHelper.Success();
            },
            onSave: function() {
                var customSettings = {
                    data: packageDropdownValues()
                };
                return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
            }
        }
    });
    VSS.notifyLoadSucceeded();
});