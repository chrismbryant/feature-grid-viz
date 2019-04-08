var svg = d3.select("#svg_main");
var svg_grid = d3.select("#svg_grid");

var counter = 0;
var throttle_mod;

var box_size = 100;
var box_opacity = 0.4;
var box_stroke_opacity = 0;
var frozen = false;
var [box_x, box_y] = [0, 0];
const default_box_opacity = box_opacity;

const size = 500;
const width = size;
const height = size;
const padding = 0.25;
const point_radius = 2;
const point_opacity = 0.5;
const ease_duration = 180;
const cell_size = size;
var r_scaled = point_radius * cell_size/size;

var m = 1;
var data;
var data_2d;
var labels;
var label_type;
var data_tags;
var feature_names;

svg.attr("width", size)
  .attr("height", size);

svg_grid.attr("width", width)
  .attr("height", height);

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
  throttle_mod = d3.max([1, d3.min([Math.round(m/2000), 20])]);
  console.log(throttle_mod);
  labels = my_data["labels"];
  label_type = my_data["label_type"];
  data_tags = my_data["label_tags"];
  feature_names = my_data["feature_names"];

  var g_main = plot_data(svg, data_2d, labels);
  var g_grid = plot_data(svg_grid, data_2d, labels);

  init_box(box_size);
  animate_box();

}

function transform_data(data_2d, width, height, padding) {
  // x_hat = kx + b
  const [xs, ys] = d3.transpose(data_2d);
  const [x_min, x_max] = [d3.min(xs), d3.max(xs)];
  const [y_min, y_max] = [d3.min(ys), d3.max(ys)];
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
  
  var g = svg.append("g")
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

function init_box(size) {
  svg.append("rect")
    .attr("id", "ref_box")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", size)
    .attr("height", size)
    .attr("fill-opacity", 0)
    .attr("fill", "black")
    .attr("stroke", "black")
    .attr("stroke-opacity", 0)
    .attr("stroke-width", 3);
}

function animate_box() {
  svg
    .on("mousemove", on_mousemove)
    .on("wheel.zoom", on_wheel_zoom)
    .on("click", on_click)
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

function change_box_style(frozen) {
  if (frozen == true) {
    box_opacity = 0;
    box_stroke_opacity = 1;
  } else {
    box_opacity = default_box_opacity;
    box_stroke_opacity = 0;
  }
  d3.select("#ref_box")
    .attr("fill-opacity", box_opacity)
    .attr("stroke-opacity", box_stroke_opacity);
}

function zoom_grid_points(box_size) {
  r_scaled = width/box_size * point_radius * cell_size/size;
  if (counter % throttle_mod != 0 && frozen == false) {return}
  d3.select("#svg_grid")
    .selectAll("circle.point")
    .attr("r", r_scaled);
}

function position_grid_points(box_x, box_y, box_size, dur=0) {
  if (counter % throttle_mod != 0 && frozen == false) {return}
  d3.select("#svg_grid")
    .selectAll("circle.point")
    .transition()
    .ease(d3.easeExp)
    .duration(dur)
    .attr("cx", function(d) {return cell_size/box_size * (d[0] - box_x);})
    .attr("cy", function(d) {return cell_size/box_size * (d[1] - box_y);});
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
  if (frozen == false) {
    frozen = true;
  } else {
    frozen = false;
  }
  var pos = d3.mouse(this);
  change_box_style(frozen);
  move_box(pos, box_size, ease_duration);
}

function on_mouseleave() {
  if (frozen == false) {
    var pos = [width / 2, height / 2];
    move_box(pos, box_size, 2 * ease_duration);
  }
}

function on_mouseenter() {
  if (frozen == false) {
    var pos = d3.mouse(this);
    console.log(pos);
    zoom_grid_points(box_size);
    move_box(pos, box_size, 2 * ease_duration);
  }
}
