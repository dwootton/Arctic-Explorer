
// Spline drawing from: https://bl.ocks.org/mbostock/4342190
// For gussian blur: https://bl.ocks.org/mbostock/1342359
// For Heatmap: http://bl.ocks.org/tjdecke/5558084


let fixedData;
let heatmap;
async function icemap(currentHeatMap) {
    heatmap = currentHeatMap;
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

    let psiLength = zippeddata[0].psi.length;

    // Hex 
    fixedData = Object.keys(data).map(key => {
            let latlong = parseLatLong(key);

            return {x:projection([latlong[1], latlong[0]])[0],
                    y:projection([latlong[1], latlong[0]])[1],
                    val: data[key]};
        });

    // fixes the hole in the point heatmap
    let addedData = fixHoleInIce();
    fixedData = fixedData.concat(addedData);

    let margin = {left : 10,
                  right : 10,
                  bottom : 10,
                  top : 10};

    // stores the previous colors of the hexagons to allow for transitions
    let prevColors = [];
    let bins;

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
        
        // fixes the visible hole on the ice map
        addedData = addedData.map(element => {
            return {
                'x':element.x,
                'y':element.y,
                'val': 1.8// 1.8 was chosen after experimention to best determine the color that fits in to the hole
            }
        });

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

        bins = hexGenerator(xyData);

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
    drawSpline(svg, bins)
}
/* Used to fill the hole in the ice by creating a square patch*/
        function fixHoleInIce(){
            let returnData =[];
            for(let xIndex = 370.0; xIndex <435.0; xIndex+=2){
                for(let yIndex = 295; yIndex <360; yIndex+=2){
                    let pt = {
                        x:xIndex,
                        y:yIndex,
                        val: Array.apply(null, Array(336)).map(Number.prototype.valueOf,1)
                    };
                    returnData.push(pt)
                }
            }
            return returnData;
        }

function grabAllData(elements){
    let foundData = [];
    for(let i = 0; i < elements.length; i++){
        let element = elements[i];

        if(element !== undefined){
            let foundElement = fixedData.find(function(point) {
                return point.x === element.x && point.y === element.y;
            })
            foundData.push(foundElement);
        } else { // the element corresponds to a area 
            let oceanElement = {
                val: Array.apply(null, Array(336)).map(Number.prototype.valueOf,0)
            }
            foundData.push(oceanElement);
        }        
    }
    return foundData;
    // next steps, plot all points. 
    // plot along path 
}

function drawLineHeatMap(myData){
    let allData = jQuery.extend(true, [], myData);

    let width = 3500;
    let height = 1000; 
    let margin = { top: 50, right: 0, bottom: 100, left: 30 };
    d3.select('#lineMap').select('svg').selectAll('g').remove();
    let svg = d3.select('#lineMap').select('svg')
                    .attr('width',width)
                    .attr('height',height)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    for(let i = 0; i < allData.length; i++){
        if(allData[i] === undefined){
            console.log(allData,i);
        } else {
            allData[i].val = bindDateAndPointToData(allData[i], new Date(1990,0),i);
        }
    }
    console.log(heatmap);
    let query = heatmap.getCurrentQuery();
    let selectedData = filterDataToQuery(query,allData);
    //let groupedSelectedData = groupData(query,selectedData);

    // Currently data is not grouped by point. Group by point and then visualize array as heatmap
    let rectHeight = rectWidth = 10;

    let xScaleWidth = query.length*rectWidth;
    if(xScaleWidth < 200){
        xScaleWidth = 200;
    }
    //Set up xScale
    let xScale = d3.scaleTime()
            .domain(d3.extent(query))
            .range([0, xScaleWidth]).nice(); 

    let yScale = function(point){
        return (point+1)*rectHeight;
    }

    //Set up Color Scale
    let colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([1, 0]);

    let rects = svg.selectAll("rect")
              .data(selectedData);

    rects.exit().remove();

    rects.enter().append('rect')
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('x', function(d){
            return xScale(d.date);
        })
        .attr('y', function(d){
            return yScale(d.point);
        })
        .attr('fill', function(d){
            if(d.data === "_NaN_"){
                return colorScale(1);
            }
            return colorScale(d.data);
        })
        

    rects
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr('x', function(d){
            return xScale(d.date);
        })
        .attr('y', function(d){

            return yScale(d.point);
        })
        .attr('fill', function(d){
            if(d.data === "_NaN_"){
                return colorScale(1);
            }
            return colorScale(d.data);
        })

    // Append Axis
    let x_axis = d3.axisBottom(xScale).ticks((query.length/15+1));

    svg.append("g")
       .call(x_axis)
       .selectAll("text")
        .attr("y", -10)
        .attr("x", 0)
        .attr("dy", ".35em");

    /*
    let xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(function (d) {
            return d;
        })
        .orient("top");

    */
    //Set up Append Rects 

}

function groupData(query,selectedData){
    let counter = 0;
    let groupedArray = [];
    while(counter < selectedData.length){
        let newArr = [];
        for(let i = 0; i < query.length; i++){
            newArr.push(selectedData[counter])
            counter++;
        }
        groupedArray.push(newArr)
    }
    return groupedArray;
}

function bindDateAndPointToData(fullData,startDate,point){
        let data = fullData.val;
        let returnData = [];
        let currentDate = new Date(startDate);

        // add data and date to the return array.
        for(let i = 0; i < data.length; i++){
            returnData.push({
                'x': fullData.x,
                'y': fullData.y,
                'data': data[i],
                'date': new Date(currentDate),
                'point': point}
            );
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return returnData;
    }

function filterDataToQuery(query,allData) {
    let returnData = [];
    let counter = 0;

    for(let i = 0; i < allData.length; i++){
        for(let innerCounter = 0; innerCounter < allData[i].val.length; innerCounter++){
            let inArray = !!query.find(item => {return item.getTime() == allData[i].val[innerCounter].date.getTime()});
            if(inArray){
                returnData.push(allData[i].val[innerCounter]);
            }
        }
    }
    return returnData;
};

/* New Line Creation for Line Spline*/
function drawSpline(svg, bins){

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


      let groups = vis.selectAll("g")


      var circle = vis.selectAll("circle")
          .data(points);

      circle.enter().append("circle")
            .attr('class','navCircle')
          .attr("r", 1e-6)
          .on("mousedown", function(d) { selected = dragged = d; redraw(); })
        .transition()
          .duration(750)
          .attr("r", 10)
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
    /* Event Code */
    function mousedown() {
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

      // Grab the closest elements along line
      let closestElements = getClosestElements() // Note: Undefined values in array corrrespond to all 0's

      // Grab other 
      let allData = grabAllData(closestElements);
      drawLineHeatMap(allData);


    }
    function getClosestElements(){
      
      let navPath = document.getElementById('navLine');
      let navCoordinates = findCoordinatesAlongPath(navPath);
      let closestElements = [];

      for(let i = 0; i < navCoordinates.length; i++){
        // grab the hexagon
        //let element = document.elementFromPoint(navCoordinates[i][0], navCoordinates[i][1]);
        
        let navCoordinate = {
            x: navCoordinates[i][0],
            y: navCoordinates[i][1]
        }
        let closestHex = findClosestPoint(bins,navCoordinate,100);
        // grab the closest element in hexagon
        let closestPoint = findClosestPoint(closestHex, navCoordinate,50)

        // As some of the vaulues were given 2 to fill in the hole
            closestElements.push(closestPoint);
      }
      return closestElements;
    }

    function findCoordinatesAlongPath(path){
        
        let totalLength = path.getTotalLength();
        let navCoordinates = []

        for(let lengthCounter = 0; lengthCounter < totalLength; lengthCounter += 25){
             let pt = path.getPointAtLength(lengthCounter);
             pt.x = Math.round(pt.x);
             pt.y = Math.round(pt.y);
             navCoordinates.push([pt.x,pt.y]);
        }
        return navCoordinates;
    }

    function findClosestPoint(points,goalPoint,threshold){
        let distances = [];
        for(let i = 0; i < points.length; i++){

            let distX = goalPoint.x - points[i].x 

            let distY = goalPoint.y - points[i].y 

            let eulcledianDistance = Math.sqrt(distX*distX +  distY*distY);
            if(eulcledianDistance < threshold){
                distances.push(eulcledianDistance);
            } else {
                distances.push(10000000);
            }
            
        }

        let min = Math.min(...distances);
        if(min ===10000000){
            return undefined;
        }
        let closestIndex = distances.indexOf(min);

        return points[closestIndex];
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
