var svg = d3.select("svg"),
    
    height = 0.85*window.screen.availHeight,
    width = window.screen.availWidth,

    zoom_low = 0.5,   // lowest zoom magnification
    zoom_high = 30;   // highest zoom magnification

var image_title = "t-SNE Visualization";

svg.attr("class", "mysvg")
    .attr("id", image_title)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("stroke", "none")

// load data
datafile = "embedding_1";

d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/chrismbryant/arXiv-structure/master/Attempt%202/papers_from_arXiv/processed/" + datafile + ".json")
    .await(ready);

// callback function  
function ready(error, data) {

    if (error) throw error;

    var TSNE_data = {
        "X": data.X,
        "info": data.info,
        "categories": data.categories
    };

    var XT = d3.transpose(TSNE_data.X),
        [x_min, x_max] = [d3.min(XT[0]), d3.max(XT[0])],
        [y_min, y_max] = [d3.min(XT[1]), d3.max(XT[1])],
        [x_c, y_c] = [0.5*(x_max + x_min), 0.5*(y_max + y_min)],
        category_vals = Object.values(TSNE_data.categories),
        t_min = d3.min(category_vals),
        t_max = d3.max(category_vals);

    var g = svg.append("g") // Group all the plotted content together
        .attr("class", "content")
        // .attr("transform", "scale(0.8)")

    // ------------------------------- POINTS ------------------------------- //
        
        var point_radius =  0.5 // 1
        var point_opacity = 0.8 // 0.6

        g.append("g")
            
            .attr("class", "points")
            .selectAll("points")
            .data(TSNE_data.X)
            .enter()

            .append("a")
                .attr("href", function(d, i){
                    var paper_id = TSNE_data.info[i][0];
                    return paper_id;
                })
                .attr("target", "_blank")
                .attr("transform", `translate(${width/4 - x_c}, ${height/8 - y_c}) scale(${5})`)

            .append("circle")
                .attr("class", "point")
                .attr("cx", function(d){
                    return d[0] - x_min;
                })
                .attr("cy", function(d){
                    return d[1] - y_min;
                })
                .attr("r", point_radius)
                .attr("fill-opacity", point_opacity)
                .attr("fill", function(d, i){
                    return d3.schemeCategory10[TSNE_data.categories[TSNE_data.info[i][1]]];
                })

            .on("mouseover", function(d) {
                d3.select(this).transition()
                    .ease(d3.easeQuadInOut)
                    .duration(25)
                    .attr("fill-opacity", 1)
                    .attr("stroke", "white")
                    .attr("stroke-width", point_radius*0.5)
                    .attr("r", point_radius * 2.5)
            })

            .on("mouseout", function(d){
                d3.select(this).transition()
                    .ease(d3.easeQuadInOut)
                    .duration(100)
                    .attr("fill-opacity", point_opacity)
                    .attr("stroke", "none")
                    .attr("r", point_radius)
            })

            // label individual points
            .append("title")
                .text(function(d, i) {
                    var content = TSNE_data.info[i];
                    return content[1] + ": " + content[2];
                });

    // ----------------------------- EXPORT SVG ----------------------------- //
        
        // saveSvgAsPng(document.getElementById(image_title), datafile + ".png", {scale: 4});
        
    // ------------------------ ZOOMING CAPABILITIES ------------------------ //

        svg.call(d3.zoom()
            .scaleExtent([zoom_low, zoom_high])
            .on("zoom", zoomed));
        
        function zoomed() {
            g.attr("transform", d3.event.transform);
        }

}