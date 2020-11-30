class PieChart {

    // Base of pie chart code from here:
    // https://www.d3-graph-gallery.com/graph/pie_basic.html

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 300,
            containerHeight: _config.containerHeight || 300,
        };
        this.config.margin = _config.margin || { top: 0, bottom: 0, right: 0, left: 0 }
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.svg = d3.select(vis.config.parentElement).append("svg");
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left + vis.width/2+460},${vis.config.margin.top +150+vis.height/2}),scale(0.8,0.8)`);
        
        vis.radius = Math.min(vis.width, vis.height) / 2 - 40;
        vis.legend();
    }

    update() {
        let vis = this;

        vis.data = {isolated: vis.i_num, released: vis.r_num, died: vis.d_num}

        vis.color = d3.scaleOrdinal()
            .domain(vis.data)
            .range(["blue", "green", "red"])

        // Compute the position of each group on the pie:
        vis.pie = d3.pie().value(function(d) {
            return d.value;
        });

        vis.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(vis.radius);

        vis.data_ready = vis.pie(d3.entries(vis.data))
        
        vis.render();
    } 

    render() {
        let vis = this; 

        // learned piechart update pattern here:
        // https://bl.ocks.org/adamjanes/5e53cfa2ef3d3f05828020315a3ba18c/22619fa86de2045b6eeb4060e747c5076569ec47

        vis.pie = vis.chart.selectAll('path')
            .data(vis.data_ready);

        vis.pie 
            .transition()
            .duration(750)
            .attrTween('d', function(a) {
                const i = d3.interpolate(this._current, a);
                this._current = i(1);
                return (t) => vis.arc(i(t));
            });

        vis.pie.enter().append("path")
            .attr('fill', function(d) { 
                return(vis.color(d.data.key)) 
            })
            .attr("stroke", "white")
            .style("stroke-width", "1px")
            .style("opacity", 0.7);



    }

    legend(){
        let vis = this;

        vis.chart
            .append("circle")
            .attr("cx", 120)
            .attr("cy", 50)
            .attr("r", 7)
            .attr('stroke', 'white')
            .style("fill", "blue")
            .attr('opacity', 0.7);

        vis.chart.append("text")
            .attr("x", 140)
            .attr("y", 50)
            .text("Infected")
            .attr('class','legend-text');


        vis.chart
            .append("circle")
            .attr("cx", 120)
            .attr("cy", 80)
            .attr("r", 7)
            .style("fill", "green")
            .attr('stroke', 'white')
            .attr('opacity', 0.7);

        vis.chart
            .append("text")
            .attr("x", 140)
            .attr("y", 80)
            .text("Released")
            .attr('class','legend-text');

        vis.chart
            .append("circle")
            .attr("cx", 120)
            .attr("cy", 110)
            .attr("r", 7)
            .style("fill", "red")
            .attr('stroke', 'white')
            .attr('opacity', 0.7);

        vis.chart.append("text")
            .attr("x", 140)
            .attr("y", 110)
            .text("Died")
            .attr('class','legend-text');
    }

}