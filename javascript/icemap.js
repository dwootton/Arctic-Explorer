async function icemap() {
    let svg = d3.select("#map svg");
    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

    let projection = d3.geoGringortenQuincuncial()
        .translate([width / 2, height / 2])
        .scale([700]);

    let path = d3.geoPath()
        .projection(projection);

	svg
        .append("path")
        .datum(d3.geoGraticule())
        .attr("class", "graticule") // styles provided in css file
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "grey");	
    

    // Load in GeoJSON data
    let world = await d3.json("../data/clipped-simplified.json");
    // Bind data and create one path per GeoJSON feature
    let geojson = topojson.feature(world, world.objects.countries);
    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        // here we use the familiar d attribute again to define the path
        .attr("d", d => path(d.geometry))
	.attr("fill", "#D2B48C");

    let zippeddata = (await d3.csv("../data/zipped.csv"))
        .map(d => ({lat: +d.lat, lon: +d.lon, psi: +d.psi}));
        // .filter(d => d.psi !== 0);

    let months = (await d3.json("../data/months.json"));

    months = months
        .map(month => month.psijson.flat()
            .map((d, i) => (
                {lat: zippeddata[i].lat, lon: zippeddata[i].lon, psi: d}
            ))
            .filter(d => !isNaN(d.psi) && d.psi !== 0) // RESUME: why not just call psijson.flat() and then pull the lat long during render. e.g.: (d, i) => zipped[i]
        );
    /*
    d3.select("#yearPicker")
        .attr("min", 0)
        .attr("max", months.length - 1)
        .on("change", function () { window.render(this.value) })
        .attr("value", 0);
    */
    window.render = m => {
        console.log("beginning render");
        let scale = d3.scaleSequential(d3.interpolateBlues)
            .domain([1, 0]);

	    // ocean is ice-free
	    svg.style("background-color", scale(0));

        // render the ice over the map
        let rects = svg.selectAll("rect.gridsquare")
            .data(months[m]);

        rects.exit().remove();

        rects
            .enter()
            .append("rect")
            .attr("class", "gridsquare")
            .merge(rects)
            .attr("x", function (d) {
                return projection([d.lon, d.lat])[0];
            })
            .attr("y", function (d) {
                return projection([d.lon, d.lat])[1];
            })
            .attr("height", 4)
            .attr("width",4)
            .attr("fill", d => scale(d.psi));
        console.log("ending render");

    };

    window.render(0);
};