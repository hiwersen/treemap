document.addEventListener("DOMContentLoaded", () => {
    /**
     * Create and render the empty SVG root when the page first loads
     * while wait for the JSON files to download
     */
    const svgW = 960;
    const svgH = 600;

    const tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("left", "-100px")
    .style("top", "-100px");

    const title = d3.select("#chart-container")
    .append("h1")
    .text("United States Educational Attainment")
    .attr("id", "title");

    const description = d3.select("#chart-container")
    .append("p")
    .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)")
    .attr("id", "description");

    const svg = d3.select("#chart-container")
    .append("svg")
    .attr("id", "svg")
    .attr("width", svgW)
    .attr("height", svgH);

    const counties = svg
    .append("g")
    .attr("class", "counties");

    const states = svg
    .append("g")
    .attr("class", "states");

    const source = d3.select("#chart-container")
    .append("div")
    .attr("id", "source")
    .html(`Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx" target="_blank">USDA Economic Research Service</a>`);

    
    const req = new XMLHttpRequest();

    const urlCountyData = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
    const urlEducationData = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

    req.open("GET", urlCountyData, true);
    //req.open("GET", urlEducationData, true);
    req.send();
    req.onload = () => {
        // Fetch topoJSON file
        let { responseText: response } = req;

        // Convert JSON string into JS Object
        const us = JSON.parse(response);

        console.log(Object.keys(us.objects));

        const featuresCounties = topojson.feature(us, us.objects.counties).features;
        const featuresStates = topojson.feature(us, us.objects.states).features;
        
        counties.selectAll("path")
        .data(featuresCounties)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("d", d3.geoPath());

        states.selectAll("path")
        .data(featuresStates)
        .enter()
        .append("path")
        .attr("class", "states")
        .attr("d", d3.geoPath())
        .attr("fill", "none")
        .attr("stroke", "white");


        req.open("GET", urlEducationData, true);
        //req.open("GET", urlEducationData, true);
        req.send();
        req.onload = () => {
            let { responseText: response } = req;

            // Convert JSON string into JS Object
            const usEducation = JSON.parse(response);

            usEducation.forEach(element => {
                element.education = element.bachelorsOrHigher;
                delete element.bachelorsOrHigher;
            });

            const minEdu = d3.min(usEducation, ({ education }) => education);
            const maxEdu = d3.max(usEducation, ({ education }) => education);

            const colorScale = d3.scaleQuantize()
            .domain([minEdu, maxEdu]) // both are inclusive
            .range([
                "#CEE8F0",
                "#A9D6E5",
                "#7DC1D8",
                "#51ADCB",
                "#3490AF",
                "#276C83",
                "#1A4858",
            ]);

            counties.selectAll("path")
            .data(usEducation)
            .attr("data-fips", ({ fips }) => fips)
            .attr("data-education", ({ education }) => education)
            .attr("fill", ({ education }) => colorScale(education))
            .on("mouseover", d => {
                tooltip
                .html(`<p>${d.area_name}, ${d.state}: ${d.education}%</p>`)
                .attr("data-education", d.education)
                .style("opacity", 1)
                .style("position", "absolute")
                .style("top", event.pageY + "px")
                .style("left", event.pageX + "px");
            })
            .on("mouseout", () => {
                tooltip
                .style("opacity", 0)
                .style("top", "-100px")
                .style("left", "-100px");
            });

            const legendW = 250;
            const legendH = 10;
            const legendCellW = legendW / colorScale.range().length;
            
    
            const legend = svg.append("g")
            .attr("id", "legend")
            .attr("transform", `translate(${svgW / 2 + legendCellW * 3}, ${paddingH / 2})`);
    
            legend.selectAll("rect")
            .data(colorScale.range())
            .enter()
            .append("rect")
            .attr("x", (_, i) => i * legendCellW)
            .attr("y", 0)
            .attr("width", legendCellW)
            .attr("height", legendH)
            .attr("fill", d => d);

            const legendScale = d3.scaleLinear()
            .domain([minEdu / 100, maxEdu / 100])
            .range([0, legendW]);

            const getTickValues = (min, max, Categorynum) => {
                let ticks = [];
                const range = (max - min) / Categorynum;
                let tick = min;

                while (ticks.length <= Categorynum) { // The last tick value is inclusive
                    ticks.push(Number.parseFloat(tick.toFixed(1)) / 100);
                    tick += range;
                }
                return ticks;
            };
            

            const legendAxisGenerator = d3.axisBottom(legendScale)
            .tickValues(getTickValues(minEdu, maxEdu, colorScale.range().length))
            .tickFormat(d3.format("0.0%"));

            
            const legendAxis = legend.append("g")
            .attr("id", "legend-axis")
            .attr("transform", `translate(0, ${legendH})`)
            .call(legendAxisGenerator);

            legendAxis.selectAll("g").attr("class", "tick");

        };





        /*
        const drawRect = context => {
            context.rect(140, 140, 140, 140);
            return context.toString();
        }

        let rectangle = d3.path();
        rectangle.rect(320, 140, 140, 140);

        svg
        .append("path")
        .attr("stroke", "black")
        .attr("fill", "yellow")
        .attr("d", drawRect(d3.path()));

        svg
        .append("path")
        .attr("stroke", "black")
        .attr("fill", "navy")
        .attr("d", rectangle.toString());
        */

        /*
        const { monthlyVariance: dataset } = response;
        const { baseTemperature } = response;

        dataset.forEach(d => {
            --d.month;
            d.temperature = baseTemperature + d.variance;
        });

        const minX = d3.min(dataset, d => d.year);
        const maxX = d3.max(dataset, d => d.year);
        const minY = d3.min(dataset, d => d.month);
        const maxY = d3.max(dataset, d => d.month);
        const minTemp = d3.min(dataset, d => d.temperature);
        const maxTemp = d3.max(dataset, d => d.temperature);

        const svgW = 960;
        const svgH = 600;
        const paddingW = 80; // SVG area
        const paddingH = 60; // SVG area
        const domainPadding = 1; // 1 year
        const cellW = svgW / (maxX - minX + 1)
        const cellH = (svgH - 2 * paddingH) / 12;

        const monthScale = d3.scaleQuantize()
        .domain([0, 11])
        .range([
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]);

        const colorScale = d3.scaleQuantize()
        .domain([minTemp, maxTemp]) // both are inclusive
        .range([
            "#005F73",
            "#0A9396",
            "#94D2BD",
            "#F7F0DE",
            "#FFDB99",
            "#FDA349",
            "#FC6722",
            "#DE2817",
            "#9B2226",
        ]);

        const xScale = d3.scaleLinear()
        .domain([minX, maxX + domainPadding])
        .range([paddingW, svgW - paddingW]);

        const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([svgH - paddingH - cellH, paddingH]);


        const svg = d3.select("#chart-container")
        .append("svg")
        .attr("id", "svg")
        .attr("width", svgW)
        .attr("height", svgH);

        const counties = svg
        .append("g")
        .attr("class", "counties");
        
        counties.selectAll("path")
        .data(dataset)
        .enter()
        .append("path")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.month))
        .attr("width", cellW )
        .attr("height", cellH)
        .attr("fill", d => colorScale(d.temperature))
        .attr("class", "county")
        .attr("data-fips", d => d.year)
        .attr("data-education", d => d.month)
        .on("mouseover", (event, d) => {
            tooltip
            .html(`${d.year} - ${monthScale(d.month)}<br>
            Temperature: ${d.temperature.toFixed(1)}℃<br>
            Variance: ${d.variance.toFixed(1)}℃`)
            .attr("data-education", d.year)
            .style("opacity", 1)
            .style("position", "absolute")
            .style("top", event.pageY + "px")
            .style("left", event.pageX + "px");
        })
        .on("mouseout", () => {
            tooltip
            .style("opacity", 0)
            .style("top", "-100px")
            .style("left", "-100px");
        });

        const yearFormat = d3.format("d");
        const xAxisGenerator = d3.axisBottom(xScale).tickFormat(yearFormat);
        const yAxisGenerator = d3.axisLeft(yScale).tickFormat(monthScale);

        const xAxis = svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${svgH - paddingH})`)
        .call(xAxisGenerator);

        const yAxis = svg
        .append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${paddingW}, ${cellH / 2})`)
        .call(yAxisGenerator);

        xAxis.selectAll("g").attr("class", "tick");
        yAxis.selectAll("g").attr("class", "tick");


        const legendH = colorScale.range().length * cellH;

        const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${svgW - paddingW + 15}, ${(svgH / 2) + (legendH / 2)})`);

        legend.selectAll("rect")
        .data(colorScale.range())
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (_, i) => -(++i * cellH))
        .attr("height", cellH)
        .attr("width", cellW)
        .attr("fill", d => d);

        const legendScale = d3.scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, -(cellH * colorScale.range().length)]);

        const getLegendValues = (minTemp, maxTemp, tickNum) => {
            const values = [];
            const range = (maxTemp - minTemp) / tickNum;
            let value = minTemp;

            while (value <= maxTemp) {
                values.push(value);
                value += range;
            }
            return values;
        };

        const legendAxisGenerator = d3.axisRight(legendScale)
        .tickValues(getLegendValues(minTemp, maxTemp, colorScale.range().length))
        .tickFormat(d3.format(".2f"));

        const legendAxis = legend
        .append("g")
        .attr("id", "legend-axis")
        .attr("transform", `translate(${cellW},0)`)
        .call(legendAxisGenerator);

        legendAxis.selectAll("g").attr("class", "tick");
        */
    
    };
});