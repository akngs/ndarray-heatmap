import ndarray from 'ndarray';
import pack from 'ndarray-pack';
import cwise from 'cwise';
import { extent } from 'd3-array';
import { interpolateLab } from 'd3-interpolate';
import { rgb } from 'd3-color';

const renderToCanvas = cwise({
  args: [
    'index', 'array',
    'scalar', 'scalar', 'scalar', 'scalar', 'scalar'
  ],
  body: function(i, value, imgArray, colors, min, max, imgWidth) {
    let colorIndex = Math.round((value - min) / (max - min) * (colors.length - 1));
    let {r, g, b, a} = colors[colorIndex];
    let base = (i[0] * imgWidth + i[1]) * 4;
    imgArray[base] = r;
    imgArray[++base] = g;
    imgArray[++base] = b;
    imgArray[++base] = a || 255;
  }
});

function heatmap() {
  let data = ndarray(new Float64Array([0]), [1, 1]);
  let colorSteps = 256;
  let domain = null;
  let colorRange = ['#000000', '#FFFFFF'];

  function render(_) {
    let canvas = _ || document.createElement('canvas');
    canvas.width = data.shape[1];
    canvas.height = data.shape[0];

    let ctx = canvas.getContext('2d');
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let imgArray = imgData.data;
    let [min, max] = domain || extent(data.data);
    let colorScale = interpolateLab(...colorRange);
    let colors = [];
    for(let i = 0; i < colorSteps; ++i) {
      colors.push(rgb(colorScale(i / (colorSteps - 1))));
    }
    renderToCanvas(data, imgArray, colors, min, max, canvas.width);
    ctx.putImageData(imgData, 0, 0);

    return canvas;
  }

  render.data = function(_) {
    if(!arguments.length) return data;

    // Convert plain JS array into ndarray
    _ = _.shape ? _ : pack(_);

    if(_.shape.length !== 2) throw new Error(`Invalid rank: ${_.shape.length}`);
    data = _;
    return render;
  }

  render.colorSteps = function(_) {
    return arguments.length ? (colorSteps = _, render) : colorSteps;
  }

  render.domain = function(_) {
    return arguments.length ? (domain = _, render) : domain;
  }

  render.colorRange = function(_) {
    return arguments.length ? (colorRange = _, render) : colorRange;
  }

  return render;
}

export {
  heatmap
};
