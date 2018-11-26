// For gussian blur: https://bl.ocks.org/mbostock/1342359
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
        .scale([750]);

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
    let geojson = topojson.feature(world, world.objects.countries)


    let countries = svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        // here we use the familiar d attribute again to define the path
        .attr("d", d => path(d.geometry))
        .attr("fill", "#D2B48C");

    svg.append("defs")
          .append("filter")
            .attr("id", "blur")
          .append("feGaussianBlur")
            .attr("stdDeviation", 1);

    //countries.attr("filter", "url(#blur)");


    let data = (await d3.json("data/lat_long_data.json")).positions;
    let zippeddata = Object.keys(data).map(key => {
        let latlong = parseLatLong(key);
        return {lat: latlong[0], lon: latlong[1], psi: data[key]};
    });
     let xs = [];
     let ys = [];
     let vals = [];

     let hexLayer = svg.append('g');


    //hexLayer.attr("filter", "url(#blur)");
     


    let margin = {left : 10,
                  right : 10,
                  bottom : 10,
                  top : 10};

    

    let color = d3.scaleLinear()
        .range(["#0C3169", '#fff'])
        .domain([0, 1]);

    let prevColors = [];

    window.render = m => {

        console.log("beginning render");
        let xyData = Object.keys(data).map(key => {
            let latlong = parseLatLong(key);
            return {x:projection([latlong[1], latlong[0]])[0],
                    y:projection([latlong[1], latlong[0]])[1],
                    val: data[key][m]};
        });

        let hexGenerator = d3.hexbin(xyData)
            .x(function(d){
                return d.x;
            })
            .y(function(d){
                return d.y;
            })
            .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
            .radius(6); // Set hex radius here, 5 is a good radius

        let bins = hexGenerator(xyData);

        bins.forEach(function(d) {
            d.min = d3.min(d, function(p) { 
                return p.val; });
            d.max = d3.max(d, function(p) { return p.val; });
            d.mean = d3.mean(d, function(p) { return p.val; });
          });

        hexLayer.selectAll('g').remove().transition().duration(4000);

        let hex = hexLayer.append('g').selectAll("path")
          .data(bins);


        hex.exit().remove();

        let newHex = hex
          .enter().append("path")
            .attr('class', 'hexagon')
            .attr("d", function(d) { return "M" + d.x + "," + d.y + hexGenerator.hexagon(); })
            .attr('stroke-width','1px')
            .attr('stroke-opacity',"0.1")
            .attr('fill-opacity','0.7')
            .attr("fill", function(d,i){

                if(!prevColors[i]){
                    prevColors[i] = color(d.mean);
                }  
                return prevColors[i];
            })
            .attr('stroke', function(d,i){

                if(!prevColors[i]){
                    prevColors[i] = color(d.mean);
                }  
                return prevColors[i];
            })
            .transition()
            .duration(2000)
            .attr("fill", function(d,i){
                prevColors[i] = color(d.mean);
                return color(d.mean);
            })
            .attr('stroke', function(d,i){
                prevColors[i] = color(d.mean);
                return color(d.mean);
            })
            
        /*
        // render the ice over the map
        let rects = svg.selectAll("rect.gridsquare")
            .data(zippeddata);


        rects.exit().remove();
        rects
            .enter()
            .append("rect")
            .attr("class", "gridsquare")
            .merge(rects)
            .transition(30000)
            .attr("x", function (d) {
                return projection([d.lon, d.lat])[0];
            })
            .attr("y", function (d) {
                return projection([d.lon, d.lat])[1];
            })
            .attr("height",2)
            .attr('width',2)
            .attr("fill", d => `rgba(255,255,255,${d.psi[m]})`);
                */

        console.log("ending render");
    };
    console.log("map window",window)

    window.render(8);
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
