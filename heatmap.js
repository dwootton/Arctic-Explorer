function heatmap(data) {
    let svg = d3.select("#heatmap table");
    let width = parseInt(svg.attr("width"));
    let height = parseInt(svg.attr("height"));

    let startYear = 1990;
    let endYear = 1993; // noninclusive

    let months = ["Jan", "Feb", "Mar", "Apr", 
                  "May", "Jun", "Jul", "Aug", 
                  "Sep", "Oct", "Nov", "Dec"];

    let years = [];
    for (let i = startYear; i < endYear; i++) {
        years.push(i);
    }

    let head = svg.append("thead").append("tr");

    head.append("th");

    head.selectAll("th.month")
        .data(months).enter()
        .append("th")
        .text(d => d)
        .attr("class", "month");

    let rows = svg.append("tbody").selectAll("tr")
        .data(years)
        .enter()
        .append("tr");

    rows.append("th").attr("class", "year").text(d => d);

    rows.selectAll("td.month")
        .data(months)
        .enter()
        .append("td")
        .style("background-color", "grey");


    let selection = null;
    d3.select("body").on("mouseup", function() {
        if (selection !== null) {
            console.log("End: " + selection);
            selection = null;
        }
    });
    d3.selectAll("th.month").on("mouseover", d => {
        if (selection !== null) {
            console.log("Add: " + d);
            selection.push(d);
        }
    });
    d3.selectAll("th.month").on("mousedown", (d) => {
        console.log("Start: " + d);
        selection = [d];
    });
    d3.selectAll("th.year").on("click", d => console.log(d));
}
