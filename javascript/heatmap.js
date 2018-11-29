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

        this.years = [];
        for (let i = this.startYear; i < this.endYear; i++) {
            this.years.push(i);
        }

        this.mousedown = false;
        // select the last 20 septembers on page load
        this.selectedMonths = ["Sep"];
        this.selectedYears = this.years.filter(y => y >= 1997);

        d3.select("#heatmap #clear").on("click", () => {
            // clearing a selection actually means to select all years and months
            this.selectedMonths = months;
            this.selectedYears = this.years;
            this.render();
        });

        d3.select("#preset-sept").on("click", () => {
            this.selectedMonths = ["Sep"];
            this.selectedYears = this.years;
            this.render();
        });
        d3.select("#preset-march").on("click", () => {
            this.selectedMonths = ["Mar"];
            this.selectedYears = this.years;
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

    getCurrentQuery() {
        return this.currentQuery;
    }

    render() {
        let data = this.psidata.slice(); // shallow copy

        let extent = d3.extent(data);
        let scale = d3.scaleSequential(d3.interpolateBlues)
            .domain([extent[1], extent[0]]);
        let greyscale = d3.scaleSequential(d3.interpolateGreys)
            .domain([extent[1], extent[0]]);

        let celldata = months.map((m, n) => {
            let slice = data.splice(0, 12);
            return {
                name: m,
                selected: this.selectedMonths.includes(m),
                years: this.years.map((y, i) => ({
                    year: y,
                    selected: this.selectedYears.includes(y) && this.selectedMonths.includes(m),
                    psi: this.psidata[i*12 + n],
                })),
            };
        });

        let hasSelection = this.selectedMonths.length !== 0 || this.selectedYears.length !== 0;

        this.table.classed("hasSelection", hasSelection);

        let colHeaders = this.head.selectAll("th.year")
            .data(this.years);
        colHeaders.enter()
            .append("th")
            .text(d => d)
            .attr("class", "year")
            .on("mousedown", d => {
                this.selectedYears = [d];
                this.mousedown = true;
                this.render();
            })
            .on("mouseover", d => {
                if (this.mousedown === true) {
                    this.selectedYears.push(d);
                    this.render();
                }
            })
            .merge(colHeaders)
            .classed("selected", d => this.selectedYears.includes(d));

        let rows = this.tbody.selectAll("tr")
            .data(celldata);

        let newRows = rows.enter()
            .append("tr");

        newRows.append("th")
            .text(d => d.name)
            .on("mousedown", d => {
                this.selectedMonths = [d.name];
                this.mousedown = true;
                this.render();
            })
            .on("mouseover", d => {
                if (this.mousedown === true) {
                    this.selectedMonths.push(d.name);
                    this.render();
                }
            });
        rows = newRows
            .merge(rows);
        rows
            .classed("selectedYear", d => d.selected)
            .select("th")
            .attr("class", d => `month ${d.selected ? "selected" : ""}`);

        let cells = rows.selectAll("td.year")
            .data(month => month.years)
        cells.enter()
            .append("td")
            .attr("class", "year")
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
        this.currentQuery = dates;
        this.currentChart.selectData(dates);

    }
}
