function filterData(query, allData) {
        let returnData = [];
        let counter = 0;
        console.log("inside filter data",allData);
        console.log(query)
        for(let i = 0; i < allData.length; i++){
            //console.log(counter);
            if(query[counter]){
                //console.log(allData[i].date.getMonth(), query[counter].getMonth())
            }
            
            if(query[counter] && allData[i].date.getMonth() == query[counter].getMonth() && allData[i].date.getFullYear() == query[counter].getFullYear()){
                returnData.push(allData[i]);
                counter += 1;
            }
        }
        return returnData;
    }

    function generatePlottingData(data,startDate){
        console.log(data);
        let returnData = [];
        let currentDate = startDate;
        // add data and date to the return array.
        for(let i = 0; i < data.length; i++){
            returnData.push({
                'data': data[i],
                'date': new Date(currentDate)}
            );
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return returnData;
    }

    async function timeChart() {
        let svg = d3.select('#chart svg');
        let width = parseInt(svg.attr("width"));
        let height = parseInt(svg.attr("height"));
        let margin = {top: 20, right: 30, bottom: 100, left: 50};

        let chart = svg.append("g").attr("transform","translate(" +margin.left+"," + margin.top+")")

        //let mydata = await d3.json("data/latlongtester2.json", function(data) {});

        let data = d3.json("data/totalConcentration.json")
            .then(function(mydata) {
                let startDate = new Date(1990,0);
                let otherData = mydata.psijson;

                let myQuery = [new Date(1990,0),new Date(1990,1), new Date(1990,2), new Date(1990,3), new Date(1990,4), new Date(1990,5), new Date(1990,6), new Date(1990,7), new Date(1990,8), new Date(1990,9), new Date(1990,10), new Date(1990,11)]; 

                let plottingData = generatePlottingData(otherData, startDate);
                
                plottingData = filterData(myQuery,plottingData);

                drawChart(plottingData, chart);

                chart.append("text")
                    .attr("x", (width + margin.left - margin.right) / 2)          
                    .attr("y", 0 - (margin.top / 4))
                    .attr("text-anchor", "middle")  
                    .style("font-size", "16px") 
                    .text("Average Sea Ice Concentration");
            });
        
        
        }

        timeChart() ;

    function drawChart(data, chart){
        let svg = d3.select('#chart svg');
        let width = parseInt(svg.attr("width"));
        let height = parseInt(svg.attr("height"));
        let margin = {top: 20, right: 30, bottom: 100, left: 50};
        let drawDuration = 1000;
        let dataMax = d3.max(data, function(d){
            return d.data;
        });//[0,1]
        let concentrationScale = d3.scaleLinear()
            .domain([0,dataMax+.1])
            .range([height-margin.bottom, margin.top]);
            
        let iScale = d3.scaleLinear()
            .domain([0, data.length])
            .range([0, width - margin.right]);

        let timeScale = d3.scaleTime()
          .domain(d3.extent(data, function(d) { 
            return d.date; 
          }))
          .range([0, width-margin.right-margin.left]); //minus both as you have the scale from the begining


        let chartData = chart.data(data);

        chartData.exit().remove();
        //Append Div
        let div = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);

        let lineGenerator = d3.line()
            .x((d, i) => timeScale(d.date))
            .y((d) => concentrationScale(d.data))
            .curve(d3.curveMonotoneX);

        console.log(data[0]);

        
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height-margin.bottom) + ")")
            .call(d3.axisBottom(timeScale)); // Create an axis component with d3.axisBottom

        chart.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(concentrationScale)); // Create an axis component with d3.axisLeft

        let path = chart.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d",lineGenerator);

        // Add the circles and draw animation
        chart.append('g')
            .selectAll(".dot")
            .data(data)
          .enter().append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function(d, i) { return timeScale(d.date) })
            .attr("cy", function(d) { return concentrationScale(d.data) })
            .attr("r", 0);


        let circleDelay = (1.0*drawDuration)/data.length;
        
        let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

        d3.selectAll("circle")
            .transition()
            .delay(function(d,i){return i*circleDelay})
            .duration(100) //function(d,i){return 3000})
            .attr("r", function(d,i){return 8})

        let toolTipAppearDuration = 200;
        let toolTipDisappearDuration = 400;

        d3.selectAll("circle")
            .on("mouseover", function(d) {
               div.transition()
                 .duration(toolTipAppearDuration)
                 .style("opacity", .7);
               div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY -70 + "px")
                 .style("left", d3.event.pageX -30 + "px");
               })
             .on("mouseout", function(d) {
               div.transition()
                 .duration(toolTipDisappearDuration)
                 .style("opacity", 0);
               })
             .on("click", function(element){
                d3.selectAll("circle").classed("selected", false);
                d3.select(this).classed("selected", true);
                window.render(element.date.getMonth())
                console.log(element);
             });

        // Adds drawing line transition 
        let totalLength = path.node().getTotalLength();
        console.log('total length: ',totalLength)
        // Set Properties of Dash Array and Dash Offset and initiate Transition
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
          .transition() // Call Transition Method
            .delay(100)
            .duration(drawDuration) // Set Duration timing (ms)
            .ease(d3.easeLinear) // Set Easing option
            .attr("stroke-dashoffset", 0);

        

        // Adding Labels 
        // Add Y Label
        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - ((height-margin.bottom)/ 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Sea Ice Concentration");

        // Add X Label
        chart.append("text")
            .attr("y", height-(margin.bottom+margin.top)/1.5)
            .attr("x", (width-margin.right)/2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date");
    }


