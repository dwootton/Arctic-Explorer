  /*
  References:
  For line hiding via click: http://bl.ocks.org/d3noob/5d621a60e2d1d02086bf

  */

  class TimeChart {
    /**
     *
     */
     constructor(data, window){
        this.map = window;
        this.first = true;
        this.margin = {top: 20, right: 30, bottom: 50, left: 50};
        let fullWidth = 735;
        let fullHeight = 300;

        this.width = fullWidth - this.margin.left - this.margin.right;
        this.height = fullHeight - this.margin.top - this.margin.bottom;
        let that = this;

        this.currentDates = [new Date(1991,0),  new Date(1991,6)];

        this.startDate = new Date(1990,0);
        this.averageLineActive = true;
        this.renderTime = (new Date()).getTime();



        data.then(function(myData){
          let data = myData.psijson;
          let plottingData = that.bindDateToData(data, that.startDate)

          that.allData = plottingData;
          that.plottingData = plottingData;
          that.calculateAverages();

          that.concentrationScale = d3.scaleLinear()
            .domain([0,1]) //812200 = 32488*25km
            .range([that.height,0]).nice();

          // Sets the scale for the x axis
          that.timeScale = d3.scaleTime()
            .domain(d3.extent(data, function(d) {
              return d.date;
            }))
            .range([0, that.width]).nice();

          that.xAxis = d3.axisBottom(that.timeScale).ticks(12);
          that.yAxis = d3.axisLeft(that.concentrationScale).ticks(12 * that.height / that.width);

          let lineGenerator = d3.line()
            .x((d) => timeScale(d.date))
            .y((d) => concentrationScale(d.data))
            .curve(d3.curveMonotoneX);

        that.svg = d3.select('#chart')
          .append('svg')
            .attr('height', fullHeight)
            .attr('width', fullWidth);

        that.svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          //.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
          .attr("width", that.width)
          .attr("height", that.height);

        that.zoomWindow = that.svg.append("rect")
          .attr("clip-path", "url(#clip)")
          .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
          .attr("width", that.width)
          .attr("height", that.height)
          .style("opacity", 1)
          .style("fill", "whitesmoke");

        that.svg.append("g")
          .attr("class", "x axis ")
          .attr('id', "axis--x")
          .attr("transform", "translate(" + that.margin.left + "," + (that.height + that.margin.top) + ")")
          .call(that.xAxis);

        that.svg.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
          .attr('id', "axis--y")
          .call(that.yAxis);

        that.line = that.svg.append("g").attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
        that.dot = that.svg.append("g").attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
        that.avgLine = that.svg.append("g").attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
        that.selector = that.svg.append("g").attr('class','lineSelctor').attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
        that.slider = that.selector.append("line");

        that.svg.append("text")
                  .attr("x", (that.width + that.margin.left - that.margin.right) / 2)
                  .attr("y", 0 + (that.margin.top*2 / 3))
                  .attr("text-anchor", "middle")
                  .style("font-size", "16px")
                  .text("Average Sea Ice Concentration");

        that.appendLabels();

        let ref = that;

        let zoomed = function(){
          let new_yScale = d3.event.transform.rescaleY(ref.concentrationScale);
          let new_xScale = d3.event.transform.rescaleX(ref.timeScale);

          ref.currentTimeScale = new_xScale;

          // re-scale axes
          ref.svg.select(".y.axis")
              .call(ref.yAxis.scale(new_yScale));

          ref.svg.select(".x.axis")
              .call(ref.xAxis.scale(new_xScale));

          // re-draw line
          let plotLine = d3.line()
              .curve(d3.curveMonotoneX)
              .x(function (d) {
                  return new_xScale(d.date);
              })
              .y(function (d) {
                  return new_yScale(d.data);
              });

          ref.line.select('path').attr("d", plotLine);
          ref.avgLine.select('path').attr("d",plotLine);

          ref.dot.selectAll('circle')
            .attr("cx", function(d,i) {
              return new_xScale(d.date);
            })
            .attr("cy", function(d) {
              return new_yScale(d.data);
            })
            .attr("r", function(d){
              return 5;
            });


          let circles = ref.selector.selectAll('circle');

          circles
            .attr('cx', function(d){
              return new_xScale(d);
            })
          ref.updateSliderZoom();
        }

        // optinos for d3.js 'hiding average'
         ref.svg.append("text")
            .attr("x", ref.width-160)             
            .attr("y", ref.margin.top+15)    

            .attr("class", "legend")
            .style("fill", "orange")
            .on("click", function(){
              // Determine if current line is visible
              let active   = ref.averageLineActive ? false : true ,
                newOpacity = active ? 0 : 1;
              ref.averageLineActive = active;
              // Hide or show the elements
              ref.avgLine.transition(500).style("opacity", newOpacity);
            })
            .text("Click to Toggle Average Line");

        that.div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var zoom = d3.zoom().scaleExtent([1, 1]).on('zoom', zoomed);

        that.zoomWindow.call(zoom);


        let selectedIndex = that.currentDates.findIndex(d => {d.getTime()===that.selectedDate.getTime()});


        that.update();
        

        /*
        let chart = svg
          .append("g")
            .attr("transform","translate(" + this.margin.left+"," + this.margin.top+")");


        let that = this;
        this.map = window;
        this.startDate = new Date(1990,0);

        data.then(function(myData){
          let data = myData.psijson;
          let plottingData = that.bindDateToData(data, that.startDate)

          //that.map = window;
          that.data = data;
          that.plottingData = plottingData;



          that.chart = chart;

          that.timeChart();
        })
        */

     })
   }
   appendLabels(){
    this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -3)
            .attr("x",0 - ((this.height+this.margin.top)/ 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Sea Ice Concentration");

        // Add X Label
        this.svg.append("text")
            .attr("y", this.height+this.margin.top+20)
            .attr("x", ((this.width+this.margin.left)/2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date");
   }

   hideChart(){
    this.svg.attr('height',0).attr('opacity',0);
   }
   
   showChart(){
    this.svg.attr('height',this.height).attr('opacity',1);
   }
  calculateAverages(){
    let data = this.allData;
    let monthlyAverages = [];

    for(let i = 0; i < 12; i++){
      let counter = i;
      let runningSum = 0;
      let runningCounter = 0;
      while(counter < data.length){
        runningSum += data[counter].data;
        runningCounter += 1;
        counter += 12;
      }
      monthlyAverages.push(runningSum/runningCounter);
    }

    let totalAverages = Array(2018-1990).fill(monthlyAverages);
    totalAverages = [].concat.apply([],totalAverages);

    this.allAveragedData = this.bindDateToData(totalAverages, this.startDate);
    this.averagedData = this.allAveragedData;
  }

  selectAverage(query){
    this.averagedData = this.filterDataToQuery(this.currentDates, this.allAveragedData);
  }

  update(){

      let xExtent = d3.extent(this.plottingData, d => d.date);
      let yExtent = d3.extent(this.plottingData, d => d.data);
      let circleRadius = 5;
      let numPoints = this.plottingData.length;
      /* Circle Radius Adjustment: Problem- it results in uneven circles as they render at different times/ Fix with merge?
      if(numPoints < 5){
        circleRadius = 10;
      } else if(numPoints < 25){
        circleRadius = 5;
      }
`     */

      // adjust extents to ensure that the chart renders correctly
      xExtent[0] = new Date(xExtent[0]).setMonth(xExtent[0].getMonth() - 1);
      xExtent[1] = new Date(xExtent[1]).setMonth(xExtent[1].getMonth() + 1);
      yExtent[1] = yExtent[1] +.05;

      this.timeScale.domain(xExtent).nice();
      this.concentrationScale.domain(yExtent).nice();

      let view = d3.zoomTransform(this.zoomWindow.node());
      let rescaledConcentrationScale = view.rescaleY(this.concentrationScale);
      let rescaledTimeScale = view.rescaleX(this.timeScale)

      let that = this;

      this.currentTimeScale = rescaledTimeScale;

      let lineGenerator = d3.line()
            .x(function(d){
              return rescaledTimeScale(d.date)}
              )
            .y(function(d){
              return rescaledConcentrationScale(d.data)})
            .curve(d3.curveMonotoneX);

      this.yAxis.scale(rescaledConcentrationScale);
      this.xAxis.scale(rescaledTimeScale);

      this.svg.transition().duration(750).select('.y.axis').call(this.yAxis);
      this.svg.transition().duration(750).select('.x.axis').call(this.xAxis);

      //let lineSelect = this.line.selectAll('path').data(this.plottingData);

      this.updateSlider();

      if(this.first){
        this.first = false;
        this.selectedDate = this.currentDates[0];

        this.line
          .attr("clip-path", "url(#clip)")
          .append('path')
            .datum(this.plottingData)
            .attr('class','dataLine')
            .attr('d', lineGenerator)
            .style('fill','none')
            .style('stroke','black');

        this.avgLine
          .attr("clip-path", "url(#clip)")
            .append('path')
              .datum(this.averagedData)
              .attr('class','averageLine')
              .attr('d', lineGenerator)
              .style('fill','none')
              .style("stroke-dasharray", ("10, 5"))
              .style('stroke','orange')
              .style("stroke-width", "5px");

        this.dot.selectAll().remove('*');

        let chartCircles = this.dot.append("g")
          .attr("clip-path", "url(#clip)")
          .selectAll(".dot")
          .data(this.plottingData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", circleRadius)
            .attr("cx", function(d) {
              return rescaledTimeScale(d.date);
            })
            .attr("cy", function(d) {
              return rescaledConcentrationScale(d.data);
            })
            .attr("stroke", "white")
            .attr("stroke-width", "2px")
            .style("fill", '#87ceeb');

        let toolTipAppearDuration = 200;
        let toolTipDisappearDuration = 400;
        // Appends functionality
        let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

        // Creates tool tip
        chartCircles
            .on("mouseover", function(d) {
               that.div.transition()
                 .duration(toolTipAppearDuration)
                 .style("opacity", .7);
               that.div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY - 70 + "px")
                 .style("left", d3.event.pageX - 30 + "px");
               })

        // Handles tool tip
        chartCircles
             .on("mouseout", function(d) {
               that.div.transition()
                 .duration(toolTipDisappearDuration)
                 .style("opacity", 0);
               })

        // Handels point selection
        chartCircles
             .on("click", function(element){
                d3.selectAll("circle").classed("selected", false);
                d3.select(this).classed("selected", true);
                let monthsSinceStart = element.date.getMonth() + element.date.getYear()*12;
                that.selectedDate = element.date;
                monthsSinceStart -= that.startDate.getMonth() + that.startDate.getYear()*12;
                that.map.render(monthsSinceStart)
                that.updateSlider();

             });
      } else {
        let lineSelect = this.line.select("path").datum(this.plottingData);

        lineSelect.transition().duration(750)
          .attr("d", lineGenerator)
          .attr('stroke','green');

        let averageLineSelect = this.avgLine.select("path").datum(this.averagedData);

        averageLineSelect.transition().duration(750)
          .attr("d", lineGenerator)
          .attr('stroke','purple');

        //Update all circles under the clipping group
        let scatterSelect = this.dot.select('g').selectAll("circle").data(this.plottingData);

        scatterSelect.transition()
          .duration(750)
          .attr("cx", function(d) {
            return rescaledTimeScale(d.date);
          })
          .attr("cy", function(d) {
            return rescaledConcentrationScale(d.data);
          })
          .attr("stroke", "white")
          .attr("stroke-width", "2px")
          .style("fill", '#87ceeb');

        //Enter new circles
        let newCircles = scatterSelect.enter()
          .append("circle")
            .attr("cx", function(d) {
              return rescaledTimeScale(d.date);
            })
            .attr("cy", function(d) {
              return rescaledConcentrationScale(d.data);
            })
            .attr("r", circleRadius)
            .attr("stroke", "white")
            .attr("stroke-width", "2px")
            .style("fill", '#87ceeb');

        let toolTipAppearDuration = 200;
        let toolTipDisappearDuration = 400;
        // Appends functionality
        let monthNames = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

        // Creates tool tip
        newCircles
            .on("mouseover", function(d) {
               that.div.transition()
                 .duration(toolTipAppearDuration)
                 .style("opacity", .7);
               that.div.html(monthNames[d.date.getMonth()] +"</br>"+ d.date.getFullYear() + "</br>" + d.data.toFixed(2))
                 .style("top", d3.event.pageY - 70 + "px")
                 .style("left", d3.event.pageX - 30 + "px");
               })

        // Handles tool tip
        newCircles
             .on("mouseout", function(d) {
               that.div.transition()
                 .duration(toolTipDisappearDuration)
                 .style("opacity", 0);
               })

        // Handels point selection
        newCircles
             .on("click", function(element){
                d3.selectAll("circle").classed("selected", false);
                d3.select(this).classed("selected", true);
                let monthsSinceStart = element.date.getMonth() + element.date.getYear()*12;

                monthsSinceStart -= that.startDate.getMonth() + that.startDate.getYear()*12;
                that.selectedDate = element.date;
                that.updateSlider();
                that.map.render(monthsSinceStart)
             });

        // Remove old
        scatterSelect.exit().remove()


        if(!this.plottingData.includes(this.selectedDate && (new Date()).getTime() > this.renderTime +1000)){
          this.renderTime =  (new Date()).getTime();
          this.dot.select('g').select("circle").dispatch("click");
        }
      }
    }

    updateSlider(){

      this.slider
        .transition()
        .duration(500)
        .attr('x1', this.currentTimeScale(this.selectedDate))
        .attr('y1', 0)
        .attr('x2', this.currentTimeScale(this.selectedDate))
        .attr('y2', this.height)
        .style("stroke", "grey")
        .style("stroke-width", 2);
    }
    updateSliderZoom(){
      this.slider
        .attr('x1', this.currentTimeScale(this.selectedDate))
        .attr('y1', 0)
        .attr('x2', this.currentTimeScale(this.selectedDate))
        .attr('y2', this.height)
        .style("stroke", "grey")
        .style("stroke-width", 2);

    }



     filterDataToQuery(query,allData) {
        let returnData = [];
        let counter = 0;

        for(let i = 0; i < allData.length; i++){

            let inArray = !!query.find(item => {return item.getTime() == allData[i].date.getTime()});

            if(inArray){
                returnData.push(allData[i]);
            }
        }
        return returnData;
     };


     bindDateToData(data,startDate){
        let returnData = [];
        let currentDate = new Date(startDate);


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

    selectData(dates){

      this.plottingData = this.filterDataToQuery(dates, this.allData);
      this.currentDates = dates;
      this.selectedDate = dates[0];

      this.averageData = this.selectAverage(dates);
      this.update();
    }

}


