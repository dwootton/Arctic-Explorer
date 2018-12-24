class IceMapRF {

	constructor(timeSelector, mapData, worldJSON,mapPath,lineHeatMap) {
		this.data = mapData;
		this.world = worldJSON;

		this.timeSelector = timeSelector;
		this.timeSelector.currentChart.updateMap(this);
		this.svg = d3.select("#map svg");
		this.width = parseInt(this.svg.attr("width"));
    	this.height = parseInt(this.svg.attr("height"));
    	this.margin = {left : 10,
	                   right : 10,
	                   bottom : 10,
	                   top : 10};


    	this.scale = d3.scaleSequential(d3.interpolateBlues)
        	.domain([1, 0]);

       	this.svg.style("background-color", this.scale(0));
		this.hexLayer = this.svg.append('g');

		this.projection = d3.geoGringortenQuincuncial()
		    .translate([(400/700) * this.width, this.height / 2])
		    .scale([600]);

		this.path = d3.geoPath()
		        .projection(this.projection);

	    this.setupMapFeatures();

	    this.loadIceData();

	    // Used to transition between hexagon colors
	    this.previousHexagonColors = [];
	    this.bins = null;

	    // Render first datapoint
	    this.renderMap(0);
	    console.log(this);
	    mapPath = new MapPath(this,lineHeatMap)
	    mapPath.redraw()
	    console.log(mapPath);
		let modeSelection = new ModeSelector(mapPath);
		modeSelection.updateMode();
	}

	getCurrentBins() {
		return this.bins;
	}


	setupMapFeatures(){

		/* Date Label */
       	this.svg
	        .append("text")
	        .attr("id", "datelabel")
	        .attr("font-size", 24)
	        .style("fill", "white")
	        .attr("y", this.height - 10);

	    /* Draw Land */
	    //let world = await d3.json("data/clipped-simplified.json");

	    let geojson = topojson.feature(this.world, this.world.objects.countries)

	    let countries = this.svg.selectAll("path")
	        .data(geojson.features)
	        .enter()
	        .append("path")
	        .attr("d", d => this.path(d.geometry))
	        .attr("fill", "#D2B48C");

	    /* Blur Map */
	    this.svg.append("defs")
	          .append("filter")
	            .attr("id", "blur")
	          .append("feGaussianBlur")
	            .attr("stdDeviation", 1);
	}

	loadIceData(){
		//this.data = (await d3.json("data/lat_long_data.json")).positions;

		this.patchData = this.fixHoleInIce();
	}

	

     renderNavigationLine() {
     	d3.selectAll('.navigationLine')
            .remove()
     }
     parseLatLong(key) {
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

     generateHexData(selectedMonth) {
     	// filters data to selected month
     	let hexagonData = Object.keys(this.data).map(key => {
            let latlong = this.parseLatLong(key);
            let value = 0;
            if(typeof this.data[key][selectedMonth] === "number"){
                value = this.data[key][selectedMonth];
            }
            return {x:this.projection([latlong[1], latlong[0]])[0],
                    y:this.projection([latlong[1], latlong[0]])[1],
                    val: value};
        });
        
        /* Fixes the hole in the Arctic Circle For Data in IceMap View*/
	    // Note: A similar technique was applied from some of the images from the NSIDC
        this.patchData = this.patchData.map(element => {
            return {
                'x':element.x,
                'y':element.y,
                'val': 2.2
            }
        });

        hexagonData = hexagonData.concat(this.patchData);

        return hexagonData;
     }

     parseLatLong(key) {
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


     setupBins(hexagonData){
     	this.hexGenerator = d3.hexbin(hexagonData)
            .x(function(d){return d.x;})
            .y(function(d){return d.y;})
            .extent([[this.margin.left, this.margin.top], [this.width - this.margin.right, this.height - this.margin.bottom]])
            .radius(5); 

        let bins = this.hexGenerator(hexagonData);

        // Calculate Min, Maxes, and Means for each hexbin
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
        return bins;
     }

     renderHexagons() {
     	// Remove All Hex Groups
     	this.hexLayer.selectAll('g').remove();

     	// Binds Hex Data
        let hex = this.hexLayer
        	.append('g')
        	.selectAll("path")
            .data(this.bins);

        // Remove Old Elements
        hex.exit().remove();

        // New Elements
        hex
          .enter().append("path")
            .attr('class', 'hexagon')
            .attr("d", (d) => { return "M" + d.x + "," + d.y + this.hexGenerator.hexagon(); })
            .attr('stroke-width','1px')
            .attr('stroke-opacity',"1.0")
            .attr('fill-opacity','1.0')
            .attr("fill", (d,i) => {
                if(!this.previousHexagonColors[i]){
                    this.previousHexagonColors[i] = this.scale(d.mean);
                }
                return this.previousHexagonColors[i];
            })
            .attr('stroke', (d,i) => {
                if(!this.previousHexagonColors[i]){
                    this.previousHexagonColors[i] = this.scale(d.mean);
                }
                return this.previousHexagonColors[i];
            })
            .transition()
	            .duration(800)
	            .attr("fill", (d,i) => {
	                this.previousHexagonColors[i] = this.scale(d.mean);
	                return this.scale(d.mean);
	            })
	            .attr('stroke', (d,i) => {
	                this.previousHexagonColors[i] = this.scale(d.mean);
	                return this.scale(d.mean);
	            });

     }

     displayDate(selectedMonth){
     	let year = Math.floor(selectedMonth / 12) + 1990; // 1990 as that's when the data is selected for
     	let fullmonthNames =  ["January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"];
        let month = fullmonthNames[selectedMonth % 12];
        this.svg.select("#datelabel")
            .text(month + " " + year);
     }

     renderMap(selectedMonth) {
     	
	        console.log("beginning render");
	        const t0 = performance.now();

	        d3.selectAll('.navigationLine')
	            .remove()
	        /* Bins and Processes Data into hexagons*/
	        let hexagonData = this.generateHexData(selectedMonth);

	        /* Generate Hexagons */
	       	this.bins = this.setupBins(hexagonData);
	        this.renderHexagons();

	        /* Display Selected Date */ 
	        this.displayDate(selectedMonth);

	        const t1 = performance.now()
	        console.log("ending render: your time was", t1-t0);
	    
    }



     fixHoleInIce(){
        let returnData =[];
        for(let xIndex = 255.0; xIndex <315.0; xIndex+=2){
            for(let yIndex = 250; yIndex <315; yIndex+=2){
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

}