    document.addEventListener("DOMContentLoaded", () => {
        /**
         * Create and render the empty SVG root when the page first loads
         * while wait for the JSON files to download
         */
        const width = 960;
        const height = 570;
        const padding = 0.5;
        
        const legendH = 50;
        const legendW = width - 4 * padding;
        const legendBox = 15;

        const colorSet = [
            "#023047",
            "#7CA982",
            "#219EBC",
            "#C2A83E",
            "#FF0054",
            "#EFCA08",
            "#00A6A6",
            "#AF4319",
            "#F72585",
            "#9E0059",
            "#225560",
            "#FB8500",
            "#32DE8A",
            "#CFD11A",
            "#91C499",
            "#808F85",
            "#7AE582",
            "#595959"
        ];

        const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("left", "-100px")
        .style("top", "-100px");

        const title = d3.select("#diagram-container")
        .append("h1")
        .text("Video Game Sales")
        .attr("id", "title");

        const description = d3.select("#diagram-container")
        .append("p")
        .text("Top 100 Most Sold Video Games Grouped by Platform")
        .attr("id", "description");

        const svg = d3.select("#diagram-container")
        .append("svg")
        .attr("id", "tree-map")
        .attr("width", width)
        .attr("height", height);

        const legend = d3.select("#diagram-container")
        .append("svg")
        .attr("id", "legend")
        .attr("width", 120)
        .attr("height", height)
        .attr("width", legendW)
        .attr("height", legendH)
        .attr("transform", `translate(${0}, ${2 * legendBox})`);

        const req = new XMLHttpRequest();

        const urlSalesData = "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";

        req.open("GET", urlSalesData, true);
        req.send();
        req.onload = () => {
            const salesData = JSON.parse(req.responseText);

            const treemap = d3.treemap()
            .size([width,  height])
            .padding(padding);

            const root = d3.hierarchy(salesData)
            .sum(d => d.value)
            .sort((a, b) => b.height - a.height || b.value - a.value);

            treemap(root);

            const nodes = root.leaves();

            const categories = [];
            root.children.forEach(elem => categories.push(elem.data.name));

            const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(colorSet);

            const node = svg.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "group")
            .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

            node.append("rect")
            .attr("id", d => `${d.data.category}-${d.data.name}`)
            .attr("class", "tile")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("data-name", d => d.data.name)
            .attr("data-category", d => d.data.category)
            .attr("data-value", d => d.data.value)
            .attr("fill", d =>  colorScale(d.data.category))
            .on("mouseover", (event, { data }) => {
                const rect = event.target.getBoundingClientRect();
                tooltip
                .html(`<p>Name: ${data.name}<br>Category: ${data.category}<br>Value: ${data.value}</p>`)
                .attr("data-value", data.value)
                .style("opacity", 1)
                .style("position", "absolute")
                .style("top", rect.y - 85 + "px")
                .style("left", rect.x + 5 + "px");
            })
            .on("mouseout", () => {
                tooltip
                .style("opacity", 0)
                .style("top", "-100px")
                .style("left", "-100px");
            });

            node.append("text")
            .attr("class", "tile-text")
            .attr("x", "5")
            .attr("y", "20");

            // DONNOT use arrow function as callback when the 'this' keyword is going to be needed  
            node.each(function (d, i, nodes) {
                const currentElement = d3.select(this); // returns the current g.group
                const rectangleWidth = currentElement.select('rect').node().getAttribute('width');

                const words = d.data.name
                .split(' ')
                .map(word => {
                    const wordSVGLength = currentElement.select('text').text(word).node().getComputedTextLength();
                    currentElement.select('text').text('');
                    return [word, wordSVGLength];
                });

                const padding = 5;
                let y = 15;
                let text = '';
                let textSVGLength = 0;
                let count = 1;


                 while (words.length > 0) {
                    let wordSVGLength = words[0][1];

                    if (wordSVGLength > rectangleWidth - 10 * padding) {
                        text += words.shift()[0];
                        textSVGLength = currentElement.select('text')
                        .append('tspan')
                        .text(text) // Single word in the tspan
                        .attr("x", padding)
                        .attr("y", y * count)
                        .node()
                        .getComputedTextLength();

                        text = '';
                        textSVGLength = 0;
                        count++;

                    } else {

                        while (textSVGLength + wordSVGLength <= rectangleWidth - 10 * padding && words.length > 0) {
                            if (text === '') {
                                text += words.shift()[0];
                                textSVGLength = currentElement.select('text')
                                .append('tspan')
                                .text(text) // First word in the tspan
                                .attr("x", padding)
                                .attr("y", y * count)
                                .node()
                                .getComputedTextLength();

                            } else {
                                text += ' ' + words.shift()[0];
                                const lastTspan = currentElement.selectAll('text tspan').nodes().pop();
                                textSVGLength = d3.select(lastTspan).text(text).node().getComputedTextLength();
                            }

                            wordSVGLength = words.length > 0 ? words[0][1] : 0;
                        } 

                        text = '';
                        textSVGLength = 0;
                        count++;
                    }
                 }
            });

            legend.selectAll("g")
            .data(categories)
            .enter()
            .append("g")
            .attr("transform", (_, i, c) => `translate(${i * legendW / c.length}, ${0})`)
            .append("rect")
            .attr("width", legendBox)
            .attr("height", legendBox)
            .attr("class", "legend-item")
            .attr("fill", d => colorScale(d));

            legend.selectAll("g")
            .append("text")
            .text(d => d)
            .attr("x", padding)
            .attr("y", 2 * legendBox + 5)
            .style("font-size", "0.95rem");
        };
    });