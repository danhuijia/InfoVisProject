let piechart;
class ChoroplethMap {

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 650,
        };

        this.initVis();
    }

    initVis() {
        let vis = this;

        piechart = new PieChart({parentElement: '#map'});
        piechart.i_num = 1;
        piechart.r_num = 1;
        piechart.d_num = 1;
        piechart.update();

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('class', 'choMap');

        vis.chart = vis.svg.append('g')
            .attr('transform', 'translate(30,100), scale(0.8,0.8)');

        // PIE CHARTS
        vis.pies = vis.svg.append('g');
        vis.projection = d3.geoAlbers();
        vis.arc = d3.arc().innerRadius(0).outerRadius(30);
        vis.pie = d3.pie().sort(null).value(function(d){return d;});
        vis.pieColor = d3.schemeCategory10;
        
        // END PIE CHARTS

        const geoMercator = d3.geoMercator()
            .scale(6000)
             .center([129, 36]);

        vis.path = d3.geoPath(geoMercator);

    }

    update() {
        let vis = this;

        // Color legend init
        vis.colorLegend= d3.legendColor()
            .shapePadding(8)
            .title("Population")
            .shapeWidth(35)
            .shapeHeight(15)
            .labelOffset(10)
            .labelFormat(d3.format("~s"));

        // ColorScale init
        vis.colorScale = d3.scaleLinear()
            .range(['#F4F9F9', '#000E5E']);

        // ColorMap init
        vis.colorMap = new Map();

        if (vis.display === "Municipality") {
            // render map for cites
            vis.geoPath = vis.chart.selectAll('.geo-path')
                .data(topojson.feature(vis.korea_city_geo, vis.korea_city_geo.objects['municipalities-geo']).features);

            //update colorMap
            vis.municipality_population.forEach(d => {
                vis.colorMap.set(d['name'],d['pop_2019']);
            });

            // update colorScale
            vis.colorScale
                .domain(d3.extent(vis.municipality_population, d=>d['pop_2019']));

            // update color legend
            vis.colorLegend
                .scale(vis.colorScale)
                .cells([10000,100000, 400000,800000,1000000,1200000]);
       
            // console.log(d3.extent(vis.municipality_population, d=>d['pop_2019']));

        } else {
            // render map for provinces
            vis.geoPath = vis.chart.selectAll('.geo-path')
                .data(topojson.feature(vis.province_geo, vis.province_geo.objects['provinces-geo']).features);

            // update colorsMap
            vis.province_population.forEach(d => {
                vis.colorMap.set(d['name'],d['pop_2019']);
            });

            // update colorScale
            vis.colorScale
                .domain(d3.extent(vis.province_population, d=>d['pop_2019']));

            // update colorLegend
            vis.colorLegend
                .scale(vis.colorScale)
                .cells([ 1000000,3000000,5000000, 8000000,10000000, 15000000]);
        }

        vis.geoPath.exit().remove();
        vis.render();
    }

    render() {
        let vis = this;

        vis.renderGraph();
    }

    renderGraph() {
        let vis = this;

        var tooltipMap = d3.select("body").append("div")
            .attr("class", "tooltipMap")
            .style("opacity", 0);

        vis.geoPathEnter = vis.geoPath.enter().append('path')
            .attr('class', 'geo-path')
            .attr("d", vis.path);

        vis.geoPath.merge(vis.geoPathEnter)
            .transition()
            .attr("fill", d=>vis.colorScale(vis.colorMap.get(d['properties']['name_eng'])))
            .attr('stroke',"#ff8080")
            .attr('stoke-width','1.2');

        // MouseEvent
        vis.geoPath.merge(vis.geoPathEnter)
            .on('mouseover', function(d){
                vis.bar = d3.select('#barchart').selectAll('.stackbar');

                d3.select("#location-selection").text(d.properties.name_eng);
                document.getElementById("location-selection").value = d.properties.name_eng;

                // hover for map
                d3.select(this)
                    .attr('stroke', '#66ffff')
                    .attr('fill', '#ffa64d')
                    .attr('stroke-width', '2')
                    .attr('opacity', '0.5');

                // highligt for bar
                vis.bar
                    .attr('opacity', rect =>
                        rect.data.province === d['properties']['name_eng'] ?
                            "0.6" : '1')
                    .attr('stroke', rect =>
                        rect.data.province === d['properties']['name_eng'] ?
                            "#00b8e6" : 'none')
                    .attr('stroke-width', rect =>
                        rect.data.province === d['properties']['name_eng'] ?
                            "1.5" : '0');
                tooltipMap
                    .transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltipMap
                    .style("left", (d3.event.pageX) -20+ "px")
                    .style("top", (d3.event.pageY - 55) + "px")
                    .text(d['properties']['name_eng']);

                if (document.getElementById("select-province").value == 'Municipality') {
                    let selection = vis.patientInfoByProvinceAndStatus[document.getElementById("location-selection").value];
                    if ('isolated' in selection) {
                        piechart.i_num = selection.isolated;
                    } else {
                        piechart.i_num = 0;
                    }

                    if ('released' in selection) {
                        piechart.r_num = selection.released;
                    } else {
                        piechart.r_num = 0;
                    }

                    if ('deceased' in selection) {
                        piechart.d_num = selection.deceased;
                    } else {
                        piechart.d_num = 0;
                    }

                } else {

                    let selection = vis.patientInfoByMunicipalityAndStatus[document.getElementById("location-selection").value];
                    if ('isolated' in selection) {
                        piechart.i_num = selection.isolated;
                    } else {
                        piechart.i_num = 0;
                    }

                    if ('released' in selection) {
                        piechart.r_num = selection.released;
                    } else {
                        piechart.r_num = 0;
                    }

                    if ('deceased' in selection) {
                        piechart.d_num = selection.deceased;
                    } else {
                        piechart.d_num = 0;
                    }
                }
                piechart.update();

            })

            .on("mouseout", function() {
                // d3.select("#location-selection").text('None hovered');
                
                // document.getElementById("location-selection").value = 'None hovered';

                d3.select(this)
                    .attr('stroke', '#ff8080')
                    .attr("fill", d=>vis.colorScale(vis.colorMap.get(d['properties']['name_eng'])))
                    .attr('stroke-width', '1.2')
                    .attr('opacity', '1.0');

                vis.bar
                    .attr('opacity','1.0')
                    .attr('stroke', 'none');

                tooltipMap
                    .transition()
                    .duration(200)
                    .style("opacity", 0);

                piechart.i_num = 1;
                piechart.r_num = 1;
                piechart.d_num = 1;
                piechart.update();
            });


        // Append color legend
        vis.chart.selectAll(".legend").remove();
        vis.chart.selectAll(".legend-text-map").remove();
        vis.chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(550, 450)");

        vis.chart
            .select(".legend")
            .attr("class",'legend-text-map')
            .call(vis.colorLegend);
    }
}