const months = ["Jan", "Feb", "Mar", "Apr", 
  "May", "Jun", "Jul", "Aug", 
  "Sep", "Oct", "Nov", "Dec"];

class Heatmap {
    constructor(psidata, filterCallback, currentChart) {
        this.currentChart = currentChart;
        this.table = d3.select("#heatmap table");
        this.width = parseInt(this.table.attr("width"));
        this.height = parseInt(this.table.attr("height"));

        this.head = this.table.append("thead").append("tr");
        this.tbody = this.table.append("tbody");
        this.head.append("th");

        this.startYear = 1990;
        this.endYear = 2018; // noninclusive


        this.mousedown = false;
        this.selectedMonths = ["Jan", "Jul"];
        this.selectedYears = [1991];

        d3.select("#heatmap #clear").on("click", () => {
            this.selectedMonths = [];
            this.selectedYears = [];
            this.render();
        });

        this.psidata = psidata.psijson;

        d3.select("body").on("mouseup", () => {
            if (this.mousedown === true) {
                this.mousedown = false;
                this.render(); // we actually might not need this render
                filterCallback(this.selectedMonths, this.selectedYears);
            }
        });

        this.render();
    }

    render() {
        let data = this.psidata.slice(); // shallow copy

        let years = [];
        for (let i = this.startYear; i < this.endYear; i++) {
            let slice = data.splice(0, 12);
            years.push({
                year: i, 
                selected: this.selectedYears.includes(i),
                months: months.map((m, n) => ({
                    name: m, 
                    selected: this.selectedYears.includes(i) || this.selectedMonths.includes(m), 
                    psi: slice[n]
                })),
            });
        }

        let hasSelection = this.selectedMonths.length !== 0 || this.selectedYears.length !== 0;

        //console.log(years);

        let extent = d3.extent(data);
        let scale = d3.scaleSequential(d3.interpolateBlues)
            .domain([extent[1], extent[0]]);
        let greyscale = d3.scaleSequential(d3.interpolateGreys)
            .domain([extent[1], extent[0]]);

        this.table.classed("hasSelection", hasSelection);

        let colHeaders = this.head.selectAll("th.month")
            .data(months);
        colHeaders.enter()
            .append("th")
            .text(d => d)
            .attr("class", "month")
            .on("mousedown", d => {
                this.selectedMonths = [d];
                this.mousedown = true;
                this.render();
            })
            .on("mouseover", d => {
                if (this.mousedown === true) {
                    this.selectedMonths.push(d);
                    this.render();
                }
            })
            .merge(colHeaders)
            .classed("selected", d => this.selectedMonths.includes(d));

        let rows = this.tbody.selectAll("tr")
            .data(years);

        let newRows = rows.enter()
            .append("tr");

        newRows.append("th")
            .text(d => d.year)
            .on("mousedown", d => {
                this.selectedYears = [d.year];
                this.mousedown = true;
                this.render();
            })
            .on("mouseover", d => {
                if (this.mousedown === true) {
                    this.selectedYears.push(d.year);
                    this.render();
                }
            });
        rows = newRows
            .merge(rows);
        rows
            .classed("selectedYear", d => d.selected)
            .select("th")
            .attr("class", d => `year ${d.selected ? "selected" : ""}`);

        let cells = rows.selectAll("td.month")
            .data(year => year.months)
        cells.enter()
            .append("td")
            .attr("class", "month")
            .merge(cells)
            .style("background-color", d => hasSelection && !d.selected ? greyscale(d.psi) : scale(d.psi));


        let dates = [];

        let dateConverter = {
            "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4,"Jun": 5,
            "Jul": 6,"Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
        };

        for(let yearCounter = 0; yearCounter < this.selectedYears.length; yearCounter++){
            let currentYear = this.selectedYears[yearCounter];

            for(let monthCounter = 0; monthCounter < this.selectedMonths.length; monthCounter++){
                let currentMonth = this.selectedMonths[monthCounter];
                dates.push(new Date(currentYear, dateConverter[currentMonth]));
            }
        }
        console.log(dates);
        this.currentChart.selectData(dates);

    }
}
