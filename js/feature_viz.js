// Create SVGs
var svg = d3.select("#svg_main");
var svg_grid = d3.select("#svg_grid");

var counter = 0;
var throttle_mod;

// Main plot parameters
const size = 600;
const width = size;
const height = size;
const padding = 0.25;
const point_radius = 5;
const point_opacity = 0.7;
const ease_duration = 180;

// Grid plot parameters
const cell_size = size/4;
const cell_width = cell_size;
const cell_height = cell_size;
var r_scaled = point_radius * cell_size/size;
var grid_num_cells_w;
var grid_num_cells_h;
const label_font_size = 20;
var live_update = true;

// Magnifier reference box parameters
var box_size = 0.2 * size;
var box_opacity = 0.4;
var box_stroke_opacity = 0;
var frozen = false;
var [box_x, box_y] = [0, 0];
const default_box_opacity = box_opacity;
const default_box_fill = "black";

// Initialize data parameters
var m = 1;
var num_features = 1;
var data;
var data_2d;
var labels;
var label_type;
var data_tags;
var feature_names;
var start_paused = true;

const file = "data/random_small.json";

d3.queue()
  .defer(d3.json, file)
  .await(main);

// ----------------------------------------------------------------------------- //

function main(error, my_data) {

  if (error) throw error;
  
  const keys = Object.keys(my_data);

  data = my_data["data"];
  data_2d = transform_data(my_data["data_2d"], width, height, padding);
  m = data_2d.length;
  if (m > 1000) {start_paused = true} else {false};
  num_features = d3.transpose(data).length;
  throttle_mod = d3.max([1, d3.min([Math.round(m/500), 20])]);
  labels = my_data["labels"];
  label_type = my_data["label_type"];
  data_tags = my_data["label_tags"];
  feature_names = my_data["feature_names"];

  grid_num_cells_w = Math.ceil(Math.sqrt(num_features));
  grid_num_cells_h = Math.ceil(num_features/grid_num_cells_w);

  svg.attr("width", width)
    .attr("height", height);

  svg_grid.attr("width", cell_width * grid_num_cells_w)
    .attr("height", cell_height * grid_num_cells_h);

  var g_main = plot_data(svg, data_2d, labels);
  var g_grid = create_grid_frame(svg_grid, data);

  plot_cells(g_grid, data_2d, data);

  init_paused_message();
  init_box(box_size);
  animate_box();

}

function transform_data(data_2d, width, height, padding) {
  const [xs, ys] = d3.transpose(data_2d);
  const [x_mu, y_mu] = [d3.mean(xs), d3.mean(ys)];
  const [x_sigma, y_sigma] = [d3.deviation(xs), d3.deviation(ys)];
  const [x_min, x_max] = [x_mu - 3*x_sigma, x_mu + 3*x_sigma];
  const [y_min, y_max] = [y_mu - 3*y_sigma, x_mu + 3*y_sigma];
  // const [x_min, x_max] = [d3.min(xs), d3.max(xs)];
  // const [y_min, y_max] = [d3.min(ys), d3.max(ys)];
  function get_k(L, p, maxim, minim){return L * (1 - p) / (maxim - minim)}
  function get_b(L, k, maxim, minim){return 1/2 * (L - k * (maxim + minim))}
  const kx = get_k(width, padding, x_max, x_min);
  const ky = get_k(height, padding, y_max, y_min);
  const bx = get_b(width, kx, x_max, x_min);
  const by = get_b(height, ky, y_max, y_min);
  const transformed = data_2d.map(v => [kx * v[0] + bx, ky * v[1] + by]);
  return transformed;
}

function plot_data(svg, data_2d, labels) {
  
  var g = svg
    .append("g")
    .attr("class", "content");

  g.append("g")
    .attr("class", "points")
    .selectAll("points")
    .data(data_2d)
    .enter()
    .append("circle")
      .attr("class", "point")
      .attr("cx", function(d){return d[0];})
      .attr("cy", function(d){return d[1];})
      .attr("r", point_radius)
      .attr("fill-opacity", point_opacity)
      .attr("fill", function(d, i) {
        return d3.schemeCategory10[labels[i]]
      })

  return g
}

function init_paused_message() {
  const grid_width = grid_num_cells_w * cell_width;
  const grid_height = grid_num_cells_h * cell_height;
  const rect_width = 0.8 * grid_width;
  const rect_height = 0.25 * rect_width;
  svg_grid
    .append("rect")
    .attr("id", "paused_rect")
    .attr("x", 0.5 * (grid_width - rect_width))
    .attr("y", 0.5 * (grid_height - rect_height))
    .attr("width", rect_width)
    .attr("height", rect_height)
    .attr("fill-opacity", 0)
    .attr("fill", "black")
  svg_grid
    .append("text")
    .attr("id", "paused_text")
    .text("PAUSED")
    .attr("x", grid_width/2)
    .attr("y", grid_height/2)
    .attr("font-style", "italic")
    .attr("font-size", rect_height * 3/4)
    .style("text-anchor", "middle")
    .style("alignment-baseline", "central")
    .style("fill", "white")
    .attr("fill-opacity", 0);
}

function get_grid_indices(d) {
  var iw = d % grid_num_cells_w;
  var ih = Math.floor(d / grid_num_cells_w);
  return [iw, ih];
}

function get_cell_pos(d) {
  var [iw, ih] = get_grid_indices(d);
  return [cell_width * iw, cell_height * ih];
}

function create_grid_frame(svg, data) {
  
  const feature_arr = [...Array(num_features).keys()];
  
  var g = svg
    .append("g")
    .attr("class", "content")

  g.selectAll("g")
    .data(feature_arr)
    .enter()
    .append("g")
    .attr("class", "cell")
    .attr("id", function(d){return "f_" + d;})

  var defs = svg
    .append("defs")

  defs.selectAll("defs")
    .data(feature_arr)
    .enter()
    .append("clipPath")
    .attr("id", function(d){return "clip_path_" + d;})
    .append("rect")
    .attr("x", function(d){return get_cell_pos(d)[0]})
    .attr("y", function(d){return get_cell_pos(d)[1]})
    .attr("width", cell_width)
    .attr("height", cell_height);

  return g
}

function plot_cells(g, data_2d, data) {
  for (i = 0; i < num_features; i++) {
    plot_cell(g, data_2d, data, i);
  }
}

function plot_cell(g, data_2d, data, feature) {

  const all_data = d3.transpose(
    d3.transpose(data_2d).concat(d3.transpose(data))
  );

  const values = d3.transpose(all_data)[feature + 2];
  const [t_min, t_max] = [d3.min(values), d3.max(values)];

  const color_scale = d3.scaleLinear()
    .domain([t_min, t_max])
    .range([0, 1]);

  // Grid cell rectangles
  g.select("#f_" + feature)
    .append("rect")
    .attr("class", "grid_border")
    .attr("x", get_cell_pos(feature)[0])
    .attr("y", get_cell_pos(feature)[1])
    .attr("width", cell_width)
    .attr("height", cell_height)
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("fill", "none")

  // Initial cell point contents
  g.select("#f_" + feature)
    .append("g")
    .attr("class", "points")
    .selectAll("points")
    .data(all_data)
    .enter()
    .append("circle")
      .attr("class", "point")
      .attr("clip-path", "url(#clip_path_" + feature + ")")
      .attr("cx", function(d){return get_cell_pos(feature)[0] + d[0];})
      .attr("cy", function(d){return get_cell_pos(feature)[1] + d[1];})
      .attr("r", point_radius)
      .attr("fill-opacity", point_opacity)
      .attr("fill", function(d, i) {
        return d3.interpolateViridis(color_scale(d[feature + 2]));
      })

  // Numeric cell labels
  g.select("#f_" + feature)
    .append("text")
    .text(feature.toString().padStart(2, "0"))
    .attr("class", "cell_label")
    .attr("x", get_cell_pos(feature)[0] + label_font_size/4)
    .attr("y", get_cell_pos(feature)[1] + label_font_size)
    .attr("font-weight", "normal")
    .attr("font-size", label_font_size)
    .style("fill", "gray");

  return g
}

// ------------------------------ TRANSFORMATIONS ------------------------------ //

function init_box(size) {
  svg.append("rect")
    .attr("id", "ref_box")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", size)
    .attr("height", size)
    .attr("fill-opacity", 0)
    .attr("fill", default_box_fill)
    .attr("stroke", "black")
    .attr("stroke-opacity", 0)
    .attr("stroke-width", 3);
}

function animate_box() {
  svg
    .on("mousemove", on_mousemove)
    .on("wheel.zoom", on_wheel_zoom)
    .on("click", on_click)
    .on("contextmenu", on_right_click)
    .on("mouseleave", on_mouseleave)
    .on("mouseenter", on_mouseenter);
}

function move_box(pos, box_size, dur=0) {
  [box_x, box_y] = pos.map(v => v - box_size/2);
  box_x = d3.min([d3.max([box_x, 0]), width - box_size]);
  box_y = d3.min([d3.max([box_y, 0]), height - box_size]);
  d3.select("#ref_box")
    .transition()
    .ease(d3.easeExp)
    .duration(dur)
    .attr("x", box_x)
    .attr("y", box_y)
    .attr("fill-opacity", box_opacity);
  counter++
  position_grid_points(box_x, box_y, box_size, dur);
}

function resize_box() {
  var dy = d3.event.wheelDeltaY;
  box_size = box_size - dy;
  box_size = d3.min([d3.max([box_size, 1]), width]);
  d3.select("#ref_box")
    .attr("width", box_size)
    .attr("height", box_size);
  return box_size;
}

function change_box_style(action = "click") {
  if (action == "click") {
    if (frozen == true) {
      box_opacity = 0;
      box_stroke_opacity = 1;
      box_color = default_box_fill;
      var paused_text_fill_opacity = 0;
      var paused_rect_fill_opacity = 0;
    } else {
      box_opacity = default_box_opacity;
      box_stroke_opacity = 0;
      box_color = default_box_fill;
      var paused_text_fill_opacity = 0;
      var paused_rect_fill_opacity = 0;
    }
  } else if (action == "right_click") {
    if (live_update == true) {
      box_opacity = default_box_opacity;
      box_stroke_opacity = 0;
      box_color = default_box_fill;
      var paused_text_fill_opacity = 0;
      var paused_rect_fill_opacity = 0;
    } else {
      box_opacity = default_box_opacity;
      box_stroke_opacity = 1;
      box_color = "red";
      var paused_text_fill_opacity = 1;
      var paused_rect_fill_opacity = default_box_opacity;
    }
  }
  
  d3.select("#paused_text")
    .attr("fill-opacity", paused_text_fill_opacity);

  d3.select("#paused_rect")
    .attr("fill-opacity", paused_rect_fill_opacity);

  d3.select("#ref_box")
    .attr("fill-opacity", box_opacity)
    .attr("stroke-opacity", box_stroke_opacity)
    .attr("fill", box_color);
}

function zoom_grid_points(box_size) {
  r_scaled = width/box_size * point_radius * cell_size/size;
  if (live_update == false) {return}
  if (counter % throttle_mod != 0 && frozen == false) {return}
  d3.select("#svg_grid")
    .selectAll("circle.point")
    .attr("r", r_scaled);
}

function get_feature_num() {
  const feature_num = this
    .parentNode
    .parentNode
    .className
    .baseVal
    .split("_")[1];
  return parseInt(feature_num);
}

function position_grid_points(box_x, box_y, box_size, dur=0) {
  if (live_update == false) {return}
  if (counter % throttle_mod != 0 && frozen == false) {return}
  d3.select("#svg_grid")
    .selectAll("circle.point")
    .transition()
    .ease(d3.easeExp)
    .duration(dur)
    .attr("cx", function(d) {
      var feature_num = this
        .parentNode
        .parentNode
        .id.split("_")[1];
      return get_cell_pos(feature_num)[0] + cell_size/box_size * (d[0] - box_x);
    })
    .attr("cy", function(d, i) {
      var feature_num = this
        .parentNode
        .parentNode
        .id.split("_")[1];
      return get_cell_pos(feature_num)[1] + cell_size/box_size * (d[1] - box_y);
    });
}

// ------------------------------- MAIN CONTROLS ------------------------------- //

function on_mousemove() {
  if (frozen == false) {
    var pos = d3.mouse(this);
    move_box(pos, box_size);
  }
}

function on_wheel_zoom() {
  if (frozen == false) {
    var pos = d3.mouse(this);
    box_size = resize_box();
    zoom_grid_points(box_size);
    move_box(pos, box_size);
  }
}

function on_click() {
  frozen = !frozen;
  live_update = true;
  var pos = d3.mouse(this);
  change_box_style(action = "click");
  zoom_grid_points(box_size);
  move_box(pos, box_size, ease_duration);
}

function on_right_click() {
  live_update = !live_update;
  if (frozen && !live_update) {frozen = !frozen};
  var pos = d3.mouse(this);
  change_box_style(action = "right_click");
  move_box(pos, box_size, ease_duration);
  d3.event.preventDefault();
}

function on_mouseleave() {
  if (frozen == false) {
    var pos = [width / 2, height / 2];
    move_box(pos, box_size, 2 * ease_duration);
  }
}

function on_mouseenter() {
  // if (start_paused) {
  //   on_right_click();
  //   start_paused = false;
  // }
  if (frozen == false) {
    var pos = d3.mouse(this);
    move_box(pos, box_size, 2 * ease_duration);
    zoom_grid_points(box_size);
  }
}
