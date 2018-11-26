
// Spline drawing from: https://bl.ocks.org/mbostock/4342190

async function icemap() {
    let svg = d3.select("#map svg");

    


    /* Old Line creation:

    function mousedown() {
        console.log('clicked down!')
        let m = d3.mouse(this);
        xPosition.push(m[0]);
        yPosition.push(m[1]);

        if(i >= 1){
            line = vis.append("line").attr('class','navigationLine')
            .attr("x1", xPosition[i])
            .attr("y1", yPosition[i])
            .attr("x2", xPosition[i])
            .attr("y2", yPosition[i]);

        } else {
            line = vis.append("line").attr('class','navigationLine')
            .attr("x1", m[0])
            .attr("y1", m[1])
            .attr("x2", m[0])
            .attr("y2", m[1]);
        }
        i++;
        
        
        vis.on("mousemove", mousemove);
    }

    function mousemove() {
        var m = d3.mouse(this);

        line.attr("x2", m[0])
            .attr("y2", m[1]);

        xPosition[i] = m[0];
        yPosition[i] = m[1];
    }

    function mouseup() {
        var m = d3.mouse(this);
        console.log('clicked up!')
        let linePoints = calculateLinePoints(xPosition[i-1],yPosition[i-1],xPosition[i],yPosition[i],5);
        console.log(linePoints);

        xPosition[i] = m[0];
        yPosition[i] = m[1];
        vis.on("mousemove", null);
    }
    */

    function calculateLinePoints(startX, startY, endX, endY, points){
        let slope = (endY-startY)/(endX-startX);
        let dx = (endX-startX)/points;
        let y = startY;
        points = [];
        for(let x = startX; x <= endX; x += dx){
            points.push([x,y]);
            y += (slope*dx);
        }
        return points;
    }


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
        const t0 = performance.now();	

        d3.selectAll('.navigationLine')
            .remove()
        i = 0;
        xPosition = [];
        yPosition = [];

        // render the ice over the map
        let circles = svg.selectAll("circle.gridsquare")
            .data(zippeddata/*.filter(d => d.psi[m] !== 0)*/);
        circles.exit().remove();
        circles
            .enter()
            .append("circle")
            .attr("class", "gridsquare")
            .merge(circles)
            .transition('750')
            .attr("cx", function (d) {
                return projection([d.lon, d.lat])[0];
            })
            .attr("cy", function (d) {
                return projection([d.lon, d.lat])[1];
            })
            .attr("r", 2)
            .attr("fill", d => `rgba(255,255,255,${d.psi[m]})`);

        const t1 = performance.now();
        console.log("ending render, took " + (t1 - t0) + " milliseconds");
    };

    window.render(0);

    /* New Line Creation for Line Spline*/
    let vis = svg
    .on("mousedown", mousedown)
    .on("mouseup", mouseup)
    .append('g');

    let line = d3.line()
        .x(function(d){
            return d[0];
        })
        .y(function(d){
            return d[1];
        });

    let points = [[400,400]];
  

    vis.append("path")
    .datum(points)
    .attr("class", "line")
    .call(redraw);

    //WORK ON LINE DRAWING!!!!!!!// 
    /*
    let i = 0;
    let xPosition = [];
    let yPosition = [];

    */
    var dragged = null,
    selected = points[0];

    d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);

    vis.node().focus();

    function redraw() {
      vis.selectAll("path").datum(points).attr("d", line).attr('id','navLine');

      let navPath = document.getElementById('navLine');
      let totalLength = navPath.getTotalLength();

      console.log('halfway is at',navPath.getPointAtLength(totalLength/2))
      var circle = vis.selectAll("circle")
          .data(points);

      circle.enter().append("circle")
            .attr('class','navCircle')
          .attr("r", 1e-6)
          .on("mousedown", function(d) { selected = dragged = d; redraw(); })
        .transition()
          .duration(750)
//          .easeLinear()
          .attr("r", 6.5)
          .attr('fill','white');

        circle.exit().remove();

      circle
          .classed("selectedNav", function(d) { return d === selected; })
          .attr("cx", function(d) { 
            if(d){
                return d[0];
            }
             })
          .attr("cy", function(d) { 
            if(d){
                return d[1];
            } })
          .attr('fill','#aaa');




      if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    }

    function mousedown() {
        console.log(d3.mouse(vis.node()))
      points.push(selected = dragged = d3.mouse(vis.node()));
      redraw();
    }

    function mousemove() {
      if (!dragged) return;
      var m = d3.mouse(vis.node());
      dragged[0] = Math.max(0, Math.min(width, m[0]));
      dragged[1] = Math.max(0, Math.min(height, m[1]));
      redraw();
    }

    function mouseup() {
      if (!dragged) return;
      mousemove();
      dragged = null;
    }

    function keydown() {
      if (!selected) return;
      switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
          var i = points.indexOf(selected);
          points.splice(i, 1);
          selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
          redraw();
          break;
        }
      }
    }
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
