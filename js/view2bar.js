
class Barchart {

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 700,

        };
        this.config.margin = _config.margin || {top: 10, bottom: 25, right: 10, left: 30}
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.svg = d3.select(vis.config.parentElement).append("svg");
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left + 15},${vis.config.margin.top})`);

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom - 45;

        vis.keys = ["0s", "10s", "20s", "30s", "40s", "50s", "60s", "70s", "80s", "90s"];
        vis.xAxisLabel = 'Province';
        vis.yAxisLabel = 'Patient Count';

        vis.renderColorLegend();
        vis.yaxisInUse = 0;

    }

    update() {
        let vis = this;

        // filter data by date
        vis.filterbyDate = vis.patient_info.filter(d =>
            new Date(d['confirmed_date']).getTime() <= new Date(vis.date).getTime()
        );

        // data update by factor
        vis.province_age = {};
        if (vis.factor === "Total") {
            //vis.dataProcessProvincebyAge(vis.patient_info, vis.province_age);
            vis.dataProcessProvincebyAge(vis.filterbyDate, vis.province_age);
            vis.yScale = d3.scaleLinear()
                .domain([1000, 0])
                .range([0, vis.height - 30]);

        } else {
            let filterFactor = "";
            switch (vis.factor) {
                case "Recovered":
                    filterFactor = "released";
                    vis.yScale
                        .domain([100, 0])
                        .range([0, vis.height - 30]);

                    break;
                case "Infected":
                    filterFactor = "isolated";
                    vis.yScale
                        .domain([900, 0])
                        .range([0, vis.height - 30]);

                    break;
                case  "Died":
                    filterFactor = "deceased";
                    vis.yScale = d3.scaleLinear()
                        .domain([50, 0])
                        .range([0, vis.height - 30]);
            }

            vis.filteredPatient = vis.filterbyDate.filter(d => d['state'] === filterFactor);
            vis.dataProcessProvincebyAge(vis.filteredPatient, vis.province_age);

        }

        // Format to array of object
        vis.province_age_array = [];
        Object.keys(vis.province_age).forEach(d => {
            vis.province_age_array.push(vis.province_age[d]);
        });

        vis.render();
    }

    render() {
        let vis = this;
        // render y axis
        if (vis.yaxisInUse === 1){
            vis.yAxisG.remove();
        } else {
            vis.renderxAxis();
        }
        vis.renderyAxis();

        var tooltip = d3.select('body').append('div')
            .attr("class", "tooltip")
            .style("opacity", 0);


        // Render stacked bar chart: static view
        // SOURCE: https://bl.ocks.org/mjfoster83/7c9bdfd714ab2f2e39dd5c09057a55a0
        vis.chart.selectAll(".stackbar").remove();
        vis.chart.append("g")
            .selectAll("g")
            .data(d3.stack().keys(vis.keys)(vis.province_age_array))
            .enter().append("g")
            .attr("fill", function (d) {return vis.colorScale(d.key);})
            .selectAll("rect")
            .data(function (d) {return d;})
            .enter().append("rect")
            .attr("x", function (d) {return vis.xScale(d.data["province"]) + 50;})
            .attr("y", function (d) {return vis.yScale(d[1]);})
            .attr("height", function (d) {return vis.yScale(d[0]) - vis.yScale(d[1]);})
            .attr("width", vis.xScale.bandwidth())
            .attr('class', 'stackbar')
            .on("mouseover", function(d) {
                vis.map = d3.select('#map').selectAll('.geo-path');
                var count = d[1]-d[0];

                // hover on bar
                d3.select(this)
                    .attr('stroke', '#00b8e6')
                    .attr('stroke-width','1.2')
                    .attr('opacity', '0.6');

                // highlight on map
                vis.map
                    .attr('opacity',r => r['properties']['name_eng'] === d.data.province?
                        '0.5' : '1.0')
                    .attr('stroke',r => r['properties']['name_eng'] === d.data.province?
                        "#66ffff" : '#ff8080')
                    .attr('stroke-width',r => r['properties']['name_eng'] === d.data.province?
                        "2" : '1.2');

                // show tooltip
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip
                    .style("left", (d3.event.pageX) -20+ "px")
                    .style("top", (d3.event.pageY - 55) + "px")
                    .text('Count: '+count);

            })
            .on("mouseout", function() {

                d3.select(this)
                    .attr('stroke', 'none')
                    .attr('stroke-width', '0')
                    .attr('opacity', '1');

                vis.map
                    .attr('opacity','1.0')
                    .attr('stroke',"#ff8080");

                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0);

            });




    }
    renderColorLegend(){
        let vis = this;
        // set the colors
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.keys)
            .range(d3.schemeRdYlBu[10].reverse());

        // Source: https://d3-legend.susielu.com
        // Color Legend
        var colorLegend = d3.legendColor()
            .scale(vis.colorScale)
            .orient('horizontal')
            .title("Age Group")
            .shapePadding(4)
            .shapeWidth(30)
            .shapeHeight(15)
            .labelOffset(10);

        vis.chart.append("g")
            .attr("transform", "translate(60, 10)")
            .call(colorLegend);
    }
    renderxAxis(){
        let vis = this;
        vis.xScale = d3.scaleBand()
            .domain(Object.keys(vis.data))
            .range([0, vis.width - 70])
            .padding(0.2);
        vis.xAxis = d3.axisBottom(vis.xScale);

        // append X-axis
        vis.xAxisG = vis.chart.append('g').call(vis.xAxis)
            .attr('class', 'axis-color')
            .attr('transform', `translate(50,${vis.height - 30})`)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", `rotate(-65)`);

        vis.xAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('y', 0)
            .attr('x', 0)
            .text(vis.xAxisLabel);
    }
    renderyAxis(){
        let vis = this;
        vis.yAxis = d3.axisLeft(vis.yScale);
        // append Y-axis
        vis.yAxisG = vis.chart.append('g').call(vis.yAxis)
            .attr('class', 'axis-color')
            .attr('transform', `translate(50,0)`);

        vis.yAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('x', -vis.height / 2)
            .attr('y', -50)
            .attr('transform', `rotate(-90)`)
            .attr('text-anchor', 'middle')
            .text(vis.yAxisLabel);

        vis.yaxisInUse = 1;
    }

    dataProcessProvincebyAge(inArray, patientInfoByProvinceAndAge) {
        inArray.forEach(d => {
            const currentProvince = d['province'];

            patientInfoByProvinceAndAge[currentProvince] = {};
            patientInfoByProvinceAndAge[currentProvince]['province'] = currentProvince;
            patientInfoByProvinceAndAge[currentProvince]['Total'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['0s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['10s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['20s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['30s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['40s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['50s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['60s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['70s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['80s'] = 0;
            patientInfoByProvinceAndAge[currentProvince]['90s'] = 0;
        });

        inArray.forEach(d => {
            const currentProvince = d['province'];
            const currentAge = d['age'];
            patientInfoByProvinceAndAge[currentProvince]['Total'] += 1;
            patientInfoByProvinceAndAge[currentProvince][currentAge] += 1;
        });

    }

}