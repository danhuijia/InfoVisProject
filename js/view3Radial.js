class RadialChart {

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 900,
            containerHeight: _config.containerHeight || 800,
        };
        this.config.margin = _config.margin || { top: 10, bottom: 25, right: 10, left: 30 }
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.svg = d3.select(vis.config.parentElement).append("svg");
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('class', 'rad'); // set background color

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left+350},${vis.config.margin.top+400})`);

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    }

    update() {
        let vis = this;
        let y_pos = -360;
        let x_pos = -320;
        let offset = 25;

        // legend
        vis.chart.append('circle')
            .attr("cx",x_pos)
            .attr("cy",y_pos)
            .attr("r", 10)
            .attr('stroke', 'white')
            .style("fill", "#ffcc80");

        vis.chart.append("text")
            .attr('class','legend-text')
            .attr("x", x_pos + offset)
            .attr("y", y_pos)
            .text("Origin");

        vis.chart.append('circle')
            .attr("cx",x_pos)
            .attr("cy",y_pos+ offset)
            .attr("r", 10)
            .attr('stroke', 'white')
            .style("fill", "lightskyblue");

        vis.chart.append("text")
            .attr('class','legend-text')
            .attr("x", x_pos+ offset)
            .attr("y", y_pos+ offset)
            .text("Destination");


        vis.render();
    }

    // Return a list of imports for the given array of nodes.
    packageRoutes(nodes) {
        var map = {};
        var routes = [];

        // Compute a map from name to node.
        nodes.forEach(function(d) {
            map[d.data.name] = d;
        });

        // For each route, construct a link from the source to target node.
        nodes.forEach(function(d) {
            if (d.data.routes) d.data.routes.forEach(function(i) {
                routes.push(map[d.data.name].path(map[i]));
            });
        });
        return routes;
    }

    // Lazily construct the package hierarchy from class names.
    packageHierarchy(classes) {
        var map = {};

        function find(name, data) {
            var node = map[name], i;
            if (!node) {
                node = map[name] = data || {name: name, children: []};
                if (name.length) {
                    node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                    node.parent.children.push(node);
                    node.key = name.substring(i + 1);
                }
            }
            return node;
        }

        classes.forEach(function(d) {
            find(d['name'], d);
        });

        return d3.hierarchy(map[""]);
    }

    render() {
        let vis = this;

        // Tooltip template

        var tooltipRad = d3.select("body").append("div")
            .attr("class", "tooltipRad")
            .style("opacity", 0);

        // Code Source: https://observablehq.com/@d3/hierarchical-edge-bundling
        // Code Source: https://bl.ocks.org/elktamer/00b31e6e1172f7915cf4bcb3663986b6

        // Interaction Source: https://bl.ocks.org/elktamer/00b31e6e1172f7915cf4bcb3663986b6
        var diameter = 700,
            radius = diameter / 2,
            innerRadius = radius - 120;

        var cluster = d3.cluster()
            .size([360, innerRadius]);

        var line = d3.radialLine()
            .curve(d3.curveBundle.beta(0.85))
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; });

        var root = vis.packageHierarchy(vis.patientRoute)
            .sum(function(d) { return d.size; });

        cluster(root);


        vis.link = vis.chart.append("g").selectAll(".link")
            .data(vis.packageRoutes(root.leaves()))
            .enter().append("path")
            .attr('stroke','white')
            .attr('fill','none')
            .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
            .style('mix-blend-mode', 'overlay')
            //.attr("class", "link")
            .attr("d", line);


        vis.node = vis.chart.append("g").selectAll(".node")
            .data(root.leaves())
            .enter().append("text")
            //.attr("class", "node")
            .attr('stroke','antiquewhite')
            .attr('font-size','12')
            .attr("dy", "0.31em")
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .text(function(d) { return d.data.key; })

            .on('mouseover', function(d){

                vis.link.style("mix-blend-mode", null);
                d3.select(this)
                    .attr("font-weight", "bold")
                    .attr('fill', 'antiquewhite');

                vis.node
                    .each(function(n) { n.target = n.source = false; });

                vis.link
                    .classed("link-target", function(l) { if (l.target === d) return l.source.source = true; })
                    .classed("link-source", function(l) { if (l.source === d) return l.target.target = true; })
                    .filter(function(l) { return l.target === d || l.source === d; })
                    .raise();


                vis.node
                    .classed("node-target", function(n) { return n.target; })
                    .classed("node-source", function(n) { return n.source; });

                tooltipRad
                    .transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltipRad
                    .style("left", (d3.event.pageX) -20+ "px")
                    .style("top", (d3.event.pageY - 55) + "px")
                    .text('# patients travelled through : '+ d.data['pop']);
            })

            .on('mouseout', function(d){

                vis.link.style("mix-blend-mode", 'overlay');
                d3.select(this)
                    .attr("font-weight", null)
                    .attr('fill', 'none');

                vis.link
                    .classed("link-target", false)
                    .classed("link-source", false);
                vis.node
                    .classed("node-target", false)
                    .classed("node-source", false);

                tooltipRad
                    .transition()
                    .duration(200)
                    .style("opacity", 0);
            });
    }
}