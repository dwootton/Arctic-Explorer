async function icemap() {
    let svg = d3.select("#map svg");
    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

    let scale = d3.scaleSequential(d3.interpolateBlues)
        .domain([1, 0]);

    // ocean is ice-free
    svg.style("background-color", scale(0));

    let projection = d3.geoGringortenQuincuncial()
        .translate([width / 2, height / 2])
        .scale([620]);

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
    let world = await d3.json("data/clipped-simplified.json");
    // Bind data and create one path per GeoJSON feature
    let geojson = topojson.feature(world, world.objects.countries);
    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        // here we use the familiar d attribute again to define the path
        .attr("d", d => path(d.geometry))
        .attr("fill", "#D2B48C");

    let data = (await d3.json("data/lat_long_data.json")).positions;
    let zippeddata = Object.keys(data).map(key => {
        let latlong = parseLatLong(key);
        return {lat: latlong[0], lon: latlong[1], psi: data[key]};
    });

    window.render = m => {
        console.log("beginning render");

        // render the ice over the map
        let circles = svg.selectAll("circle.gridsquare")
            .data(zippeddata/*.filter(d => d.psi[m] !== 0)*/);
        circles.exit().remove();
        circles
            .enter()
            .append("circle")
            .attr("class", "gridsquare")
            .merge(circles)
            .attr("cx", function (d) {
                return projection([d.lon, d.lat])[0];
            })
            .attr("cy", function (d) {
                return projection([d.lon, d.lat])[1];
            })
            .attr("r", 2)
            .attr("fill", d => `rgba(255,255,255,${d.psi[m]})`);
        console.log("ending render");
    };

    window.render(0);
};

function parseLatLong(key) {
    let halves = key.split("x");
    if (halves.length !== 2) {
        return null;
    }
    if (!halves[0].startsWith("l")) {
        return null;
    }
    let lat = parseFloat(halves[0].replace("l", " ").replace("_", "."));
    let long = parseFloat(halves[1].replace("neg", "-").replace("_", "."));
    return [lat, long];
}
