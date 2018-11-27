
// Spline drawing from: https://bl.ocks.org/mbostock/4342190
// For gussian blur: https://bl.ocks.org/mbostock/1342359

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

async function icemap() {
    let svg = d3.select("#map svg");
    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

    let scale = d3.scaleSequential(d3.interpolateBlues)
        .domain([1, 0]);

    // ocean is ice-free
    svg.style("background-color", scale(0));
    let hexLayer = svg.append('g');   
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

    // Hex 
       


    let margin = {left : 10,
                  right : 10,
                  bottom : 10,
                  top : 10};

    // stores the previous colors of the hexagons to allow for transitions
    let prevColors = [];

    window.render = m => {

        console.log("beginning render");
        const t0 = performance.now();	

        d3.selectAll('.navigationLine')
            .remove()

        let xyData = Object.keys(data).map(key => {
            let latlong = parseLatLong(key);
            let value = 0;
            if(typeof data[key][m] === "number"){
                value = data[key][m];
            }
            return {x:projection([latlong[1], latlong[0]])[0],
                    y:projection([latlong[1], latlong[0]])[1],
                    val: value};
        });
        // Data to add
        console.log(xyData);
        let addedData = fixHoleInIce();
        
        


        xyData = xyData.concat(addedData);
        let hexGenerator = d3.hexbin(xyData)
            .x(function(d){
                return d.x;
            })
            .y(function(d){
                return d.y;
            })
            .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
            .radius(5); // Set hex radius here, 5 is a good radius

        let bins = hexGenerator(xyData);

        bins.forEach(function(d) {
            d.min = d3.min(d, function(p) { 
                if(typeof p.val ==="number"){
                    return p.val;
                }
                return 0;
                });
            d.max = d3.max(d, function(p) {
                if(typeof p.val ==="number"){
                    return p.val;
                }
                return 0;
                
            });
            d.mean = d3.mean(d, function(p) { 
                if(typeof p.val ==="number"){
                    return p.val;
                }
                return 0;
                });
          });

        hexLayer.selectAll('g').remove();

        let hex = hexLayer.append('g').selectAll("path")
          .data(bins);


        hex.exit().remove();

        let newHex = hex
          .enter().append("path")
            .attr('class', 'hexagon')
            .attr("d", function(d) { return "M" + d.x + "," + d.y + hexGenerator.hexagon(); })
            .attr('stroke-width','1px')
            .attr('stroke-opacity',"1.0")
            .attr('fill-opacity','1.0')
            .attr("fill", function(d,i){

                if(!prevColors[i]){
                    prevColors[i] = scale(d.mean);
                }  
                return prevColors[i];
            })
            .attr('stroke', function(d,i){

                if(!prevColors[i]){
                    prevColors[i] = scale(d.mean);
                }  
                return prevColors[i];
            })
            .transition()
            .duration(800)
            .attr("fill", function(d,i){
                prevColors[i] = scale(d.mean);
                return scale(d.mean);
            })
            .attr('stroke', function(d,i){
                prevColors[i] = scale(d.mean);
                return scale(d.mean);
            })
        const t1 = performance.now()
        console.log("ending render: your time was", t1-t0);
    };

    window.render(0);
    drawSpline(svg)
}
/* Used to fill the hole in the ice by creating a square patch*/
function fixHoleInIce(){
            let returnData =[];
            for(let xIndex = 370.0; xIndex <435.0; xIndex+=2){
                for(let yIndex = 295; yIndex <360; yIndex+=2){
                    let pt = {
                        x:xIndex,
                        y:yIndex,
                        val:2.0
                    };
                returnData.push(pt)
                }
            }
            return returnData;
        }
/* New Line Creation for Line Spline*/
function drawSpline(svg){

    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

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
                console.log('x:',d[0])
                return d[0];
            }
             })
          .attr("cy", function(d) { 
            if(d){
                console.log('y:',d[1])
                return d[1];
            } })
          .attr('fill','#aaa');
          


      if (d3.event) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    }
    /* Event Code */
    function mousedown() {
      d3.mouse(vis.node())
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
}
    


    

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
